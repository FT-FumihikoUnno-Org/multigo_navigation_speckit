#include "nav_goal/nav_goal.h"

namespace nav_goal
{
    Nav_goal::Nav_goal()
        : Node("nav_goal")
    {
        this->set_parameter(rclcpp::Parameter("use_sim_time", false));
        // Declare node parameters
        this->declare_parameter<std::string>("map_frame", "map");
        this->declare_parameter<std::string>("camera_front_left_frame", "camera_rgb_frame");
        this->declare_parameter<std::string>("camera_front_right_frame", "camera_rgb_frame");
        this->declare_parameter<int>("desired_aruco_marker_id_left", -1);
        this->declare_parameter<int>("desired_aruco_marker_id_right", -1);
        this->declare_parameter<float>("aruco_distance_offset", -0.5);
        this->declare_parameter<float>("aruco_left_right_offset", 0);
        this->declare_parameter<std::string>("marker_topic_front_left", "aruco_detect/markers_front");
        this->declare_parameter<std::string>("marker_topic_front_right", "aruco_detect/markers_front");
        // Retrieve parameter values
        this->get_parameter("map_frame", map_frame);
        this->get_parameter("camera_front_left_frame", camera_front_left_frame);
        this->get_parameter("camera_front_right_frame", camera_front_right_frame);
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_left);
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_right);
        this->get_parameter("aruco_distance_offset", aruco_distance_offset);
        this->get_parameter("aruco_left_right_offset", aruco_left_right_offset);
        this->get_parameter("marker_topic_front_left", marker_topic_front_left);
        this->get_parameter("marker_topic_front_right", marker_topic_front_right);

        RCLCPP_INFO_STREAM(this->get_logger(), "camera_front_left_frame " << camera_front_left_frame);
        RCLCPP_INFO_STREAM(this->get_logger(), "desired_aruco_marker_id_left " << desired_aruco_marker_id_left);

        // Initialize the buffer and listener for TF
        tf_buffer = std::make_shared<tf2_ros::Buffer>(this->get_clock());
        tf_listener = std::make_shared<tf2_ros::TransformListener>(*tf_buffer);

        pose_array_sub_left = this->create_subscription<geometry_msgs::msg::PoseArray>(marker_topic_front_left, 10,
                            std::bind(&Nav_goal::arucoPoseCallbackLeft, this, std::placeholders::_1));

        pose_array_sub_right = this->create_subscription<geometry_msgs::msg::PoseArray>(marker_topic_front_right, 10,
                            std::bind(&Nav_goal::arucoPoseCallbackRight, this, std::placeholders::_1));

        // Create a publisher for Nav2 goal
        goal_pub = this->create_publisher<geometry_msgs::msg::PoseStamped>("goal_pose", 10);

        auto period = std::chrono::milliseconds(1000 / publish_rate);  // 1000 ms / rate (Hz)

        front_timer = this->create_wall_timer(
        period,
        std::bind(&Nav_goal::frontMarkerGoalPublisher, this));
    }

    int Nav_goal::extractMarkerIds(const geometry_msgs::msg::PoseArray::SharedPtr& pose_array_msg)
    {
        std::string frame_id = pose_array_msg->header.frame_id;

        // Use regex to capture the marker ID from frame_id
        std::regex marker_id_regex("aruco_marker_(\\d+)");
        std::smatch match;
        int marker_id;

        if (std::regex_search(frame_id, match, marker_id_regex) && match.size() > 1)
        {
            marker_id = std::stoi(match[1].str());
            // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "Detected marker ID: %d", marker_id);
        }
        else
        {
            // RCLCPP_WARN(rclcpp::get_logger("MarkerIDLogger"), "Could not extract marker ID from frame_id: %s", frame_id.c_str());
        }
    
        return marker_id;
    }

    void Nav_goal::arucoPoseCallbackLeft(const geometry_msgs::msg::PoseArray::SharedPtr msg)
    {
        geometry_msgs::msg::TransformStamped cameraToMap;
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_left);
        this->get_parameter("aruco_distance_offset", aruco_distance_offset);
        this->get_parameter("aruco_left_right_offset", aruco_left_right_offset);

        try
        {
            //  Aruco marker to the base_link
            cameraToMap = tf_buffer->lookupTransform(map_frame, camera_front_left_frame, tf2::TimePointZero, tf2::durationFromSec(2));

            for (int i = 0; i < msg->poses.size(); i++)
            {
                found_aruco_marker_id = extractMarkerIds(msg);  // Extract marker ID from frame

                if (found_aruco_marker_id == desired_aruco_marker_id_left)  // Check if aruco makrer matches desired marker
                {
                    marker_time_left = this->now();
                    // add marker position
                    double marker_tx = msg->poses[i].position.x + aruco_distance_offset;
                    double marker_ty = msg->poses[i].position.y + aruco_left_right_offset;
                    double marker_tz = msg->poses[i].position.z;
                    double marker_rx = msg->poses[i].orientation.x;
                    double marker_ry = msg->poses[i].orientation.y;
                    double marker_rz = msg->poses[i].orientation.z;
                    double marker_rw = msg->poses[i].orientation.w;

                    if (marker_tx < goal_distance_threshold )
                    {
                        stage_3_docking_status = true;
                    }
                    else
                    {
                        stage_3_docking_status = false;
                    }

                    // goal header
                    goal_msg_left.header.stamp = this->get_clock()->now();
                    goal_msg_left.header.frame_id = "map";  // Goal is in the map frame

                    tf2::Quaternion camera_q(
                        cameraToMap.transform.rotation.x,
                        cameraToMap.transform.rotation.y,
                        cameraToMap.transform.rotation.z,
                        cameraToMap.transform.rotation.w);

                    tf2::Transform camera_transform(camera_q, tf2::Vector3(
                        cameraToMap.transform.translation.x,
                        cameraToMap.transform.translation.y,
                        cameraToMap.transform.translation.z));

                    tf2::Vector3 marker_t(marker_tx, marker_ty, marker_tz);
                    tf2::Vector3 transformed_marker_t = camera_transform * marker_t;

                    goal_msg_left.pose.position.x = transformed_marker_t.x();
                    goal_msg_left.pose.position.y = transformed_marker_t.y();
                    goal_msg_left.pose.position.z = transformed_marker_t.z();

                    // Combine orientations
                    tf2::Quaternion marker_q(marker_rx, marker_ry, marker_rz, marker_rw);
                    tf2::Quaternion combined_q = camera_q * marker_q;  // Quaternion multiplication

                    // 180-degree yaw adjustment
                    tf2::Quaternion yaw_180_q;
                    yaw_180_q.setRPY(0, 0, M_PI);  // Roll=0, Pitch=0, Yaw=180 degrees (π radians)

                    tf2::Quaternion final_q = combined_q * yaw_180_q;  // First combined orientation, then yaw adjustment
                    goal_msg_left.pose.orientation.x = final_q.x();
                    goal_msg_left.pose.orientation.y = final_q.y();
                    goal_msg_left.pose.orientation.z = final_q.z();
                    goal_msg_left.pose.orientation.w = final_q.w();
                } // end of if for matching marker ids
            } // end of for loop
            // RCLCPP_INFO_STREAM(rclcpp::get_logger("nav_goal"), "frame ID: " << msg->header.frame_id);
        }  // end of try 
        catch (tf2::TransformException &ex)
        {
            RCLCPP_WARN(this->get_logger(), "Could not transform aruco_marker_23 to map: %s", ex.what());
            return;
        }
            
    }

    void Nav_goal::arucoPoseCallbackRight(const geometry_msgs::msg::PoseArray::SharedPtr msg)
    {
        geometry_msgs::msg::TransformStamped cameraToMap;
        this->get_parameter("desired_aruco_marker_id_right", desired_aruco_marker_id_right);
        this->get_parameter("aruco_distance_offset", aruco_distance_offset);
        this->get_parameter("aruco_right_right_offset", aruco_left_right_offset);

        try
        {
            //  Aruco marker to the base_link
            cameraToMap = tf_buffer->lookupTransform(map_frame, camera_front_right_frame, tf2::TimePointZero, tf2::durationFromSec(2));

            for (int i = 0; i < msg->poses.size(); i++)
            {
                found_aruco_marker_id = extractMarkerIds(msg);  // Extract marker ID from frame

                if (found_aruco_marker_id == desired_aruco_marker_id_right)  // Check if aruco makrer matches desired marker
                {
                    marker_time_right = this->now();
                    // add marker position
                    double marker_tx = msg->poses[i].position.x + aruco_distance_offset;
                    double marker_ty = msg->poses[i].position.y - aruco_left_right_offset;
                    double marker_tz = msg->poses[i].position.z;
                    double marker_rx = msg->poses[i].orientation.x;
                    double marker_ry = msg->poses[i].orientation.y;
                    double marker_rz = msg->poses[i].orientation.z;
                    double marker_rw = msg->poses[i].orientation.w;

                    if (marker_tx < goal_distance_threshold )
                    {
                        stage_3_docking_status = true;
                    }
                    else
                    {
                        stage_3_docking_status = false;
                    }

                    // goal header
                    goal_msg_right.header.stamp = this->get_clock()->now();
                    goal_msg_right.header.frame_id = "map";  // Goal is in the map frame

                    tf2::Quaternion camera_q(
                        cameraToMap.transform.rotation.x,
                        cameraToMap.transform.rotation.y,
                        cameraToMap.transform.rotation.z,
                        cameraToMap.transform.rotation.w);

                    tf2::Transform camera_transform(camera_q, tf2::Vector3(
                        cameraToMap.transform.translation.x,
                        cameraToMap.transform.translation.y,
                        cameraToMap.transform.translation.z));

                    tf2::Vector3 marker_t(marker_tx, marker_ty, marker_tz);
                    tf2::Vector3 transformed_marker_t = camera_transform * marker_t;

                    goal_msg_right.pose.position.x = transformed_marker_t.x();
                    goal_msg_right.pose.position.y = transformed_marker_t.y();
                    goal_msg_right.pose.position.z = transformed_marker_t.z();

                    // Combine orientations
                    tf2::Quaternion marker_q(marker_rx, marker_ry, marker_rz, marker_rw);
                    tf2::Quaternion combined_q = camera_q * marker_q;  // Quaternion multiplication

                    // 180-degree yaw adjustment
                    tf2::Quaternion yaw_180_q;
                    yaw_180_q.setRPY(0, 0, M_PI);  // Roll=0, Pitch=0, Yaw=180 degrees (π radians)

                    tf2::Quaternion final_q = combined_q * yaw_180_q;  // First combined orientation, then yaw adjustment
                    goal_msg_right.pose.orientation.x = final_q.x();
                    goal_msg_right.pose.orientation.y = final_q.y();
                    goal_msg_right.pose.orientation.z = final_q.z();
                    goal_msg_right.pose.orientation.w = final_q.w();
                } // end of if for matching marker ids
            } // end of for loop
            // RCLCPP_INFO_STREAM(rclcpp::get_logger("nav_goal"), "frame ID: " << msg->header.frame_id);
        }  // end of try 
        catch (tf2::TransformException &ex)
        {
            RCLCPP_WARN(this->get_logger(), "Could not transform aruco_marker_23 to map: %s", ex.what());
            return;
        }
            
    }

    void Nav_goal::frontMarkerGoalPublisher()
    {
        rclcpp::Time current_time = this->now();
        // Calculate dt as the duration since the last loop
        rclcpp::Duration duration = current_time - marker_time_left;
        callback_duration_left = duration.seconds();  // seconds as a double
        duration = current_time - marker_time_right;
        callback_duration_right = duration.seconds();  // seconds as a double
        // RCLCPP_INFO(this->get_logger(), "front camera callback_duration: %f", callback_duration_left);

        // stage_4_docking_status = true;
        // Calculate the error

        if (callback_duration_left < callback_duration_right && 
            callback_duration_left < marker_delay_threshold_sec && 
            stage_3_docking_status == false)
        {
            // Publish the goal
            goal_pub->publish(goal_msg_left);
            // RCLCPP_INFO(this->get_logger(), "Publishing LEFT goal: Position(%f, %f, %f), Orientation(%f, %f, %f, %f)",
            //             goal_msg_left.pose.position.x, goal_msg_left.pose.position.y, goal_msg_left.pose.position.z,
            //             goal_msg_left.pose.orientation.x, goal_msg_left.pose.orientation.y, goal_msg_left.pose.orientation.z, goal_msg_left.pose.orientation.w); 
        }
        else if (callback_duration_left > callback_duration_right && 
                callback_duration_right < marker_delay_threshold_sec &&
                stage_3_docking_status == false)
        {
            // Publish the goal
            goal_pub->publish(goal_msg_right);
            // RCLCPP_INFO(this->get_logger(), "Publishing RIGHT goal: Position(%f, %f, %f), Orientation(%f, %f, %f, %f)",
            //             goal_msg_right.pose.position.x, goal_msg_right.pose.position.y, goal_msg_right.pose.position.z,
            //             goal_msg_right.pose.orientation.x, goal_msg_right.pose.orientation.y, goal_msg_right.pose.orientation.z, goal_msg_right.pose.orientation.w); 
        }
    }
         
} // namespace nav_goal

int main(int argc, char *argv[])
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<nav_goal::Nav_goal>());
    rclcpp::shutdown();
    return 0;
}
