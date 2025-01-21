#include "nav_docking/nav_docking.h"

namespace nav_docking
{
    Nav_docking::Nav_docking()
        : Node("nav_docking")
    {
        // Initialize the action server
        action_server_ = rclcpp_action::create_server<Dock>(
            this,
            "dock",
            std::bind(&Nav_docking::handle_goal, this, std::placeholders::_1, std::placeholders::_2),
            std::bind(&Nav_docking::handle_cancel, this, std::placeholders::_1),
            std::bind(&Nav_docking::handle_accepted, this, std::placeholders::_1));

        //RCLCPP_INFO(this->get_logger(), "Nav_docking action server started.");

        this->set_parameter(rclcpp::Parameter("use_sim_time", false));
        // Declare node parameters
        this->declare_parameter<std::string>("base_frame", "base_link");
        this->declare_parameter<std::string>("camera_left_frame", "camera_left_frame");
        this->declare_parameter<std::string>("camera_right_frame", "camera_right_frame");
        this->declare_parameter<int>("desired_aruco_marker_id_left", -1);
        this->declare_parameter<int>("desired_aruco_marker_id_right", -1);
        this->declare_parameter<float>("aruco_distance_offset", -0.5);
        this->declare_parameter<float>("aruco_left_right_offset", 0);
        this->declare_parameter<float>("aruco_distance_offset_dual", 0);
        this->declare_parameter<float>("aruco_center_offset_dual", 0);

        this->declare_parameter<std::string>("marker_topic_left", marker_topic_left);
        this->declare_parameter<std::string>("marker_topic_right", marker_topic_right);

        // Retrieve parameter values
        this->get_parameter("base_frame", base_frame);
        this->get_parameter("camera_left_frame", camera_left_frame);
        this->get_parameter("camera_right_frame", camera_right_frame);
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_left);
        this->get_parameter("aruco_distance_offset", aruco_distance_offset);
        this->get_parameter("aruco_left_right_offset", aruco_left_right_offset);
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_left);
        this->get_parameter("desired_aruco_marker_id_right", desired_aruco_marker_id_right);
        this->get_parameter("aruco_distance_offset_dual", aruco_distance_offset_dual);
        this->get_parameter("aruco_center_offset_dual", aruco_center_offset_dual);
        this->get_parameter("marker_topic_left", marker_topic_left);
        this->get_parameter("marker_topic_right", marker_topic_right);

        // PID params
        this->declare_parameter("pid_parameters.kp_x", 0.00);
        this->declare_parameter("pid_parameters.ki_x", 0.00);
        this->declare_parameter("pid_parameters.kd_x", 0.00);
        this->declare_parameter("pid_parameters.kp_y", 0.00);
        this->declare_parameter("pid_parameters.ki_y", 0.00);
        this->declare_parameter("pid_parameters.kd_y", 0.00);
        this->declare_parameter("pid_parameters.kp_z", 0.00);
        this->declare_parameter("pid_parameters.ki_z", 0.00);
        this->declare_parameter("pid_parameters.kd_z", 0.00);
        this->get_parameter("pid_parameters.kp_x", kp_x);
        this->get_parameter("pid_parameters.ki_x", ki_x);
        this->get_parameter("pid_parameters.kd_x", kd_x);
        this->get_parameter("pid_parameters.kp_y", kp_y);
        this->get_parameter("pid_parameters.ki_y", ki_y);
        this->get_parameter("pid_parameters.kd_y", kd_y);
        this->get_parameter("pid_parameters.kp_z", kp_z);
        this->get_parameter("pid_parameters.ki_z", ki_z);
        this->get_parameter("pid_parameters.kd_z", kd_z);

        RCLCPP_INFO(this->get_logger(), "kp_x: %f, ki_x: %f, kd_x: %f", kp_x, ki_x, kd_x); // pid info
        RCLCPP_INFO(this->get_logger(), "kp_y: %f, ki_y: %f, kd_y: %f", kp_y, ki_y, kd_y); // pid info
        RCLCPP_INFO(this->get_logger(), "kp_z: %f, ki_z: %f, kd_z: %f", kp_z, ki_z, kd_z); // pid info

        RCLCPP_INFO_STREAM(this->get_logger(), "camera_left_frame" << camera_left_frame);
        RCLCPP_INFO_STREAM(this->get_logger(), "camera_right_frame" << camera_right_frame);
        RCLCPP_INFO_STREAM(this->get_logger(), "aruco_marker_id_left" << desired_aruco_marker_id_left);
        RCLCPP_INFO_STREAM(this->get_logger(), "aruco_marker_id_left" << desired_aruco_marker_id_left);
        RCLCPP_INFO_STREAM(this->get_logger(), "aruco_marker_id_right" << desired_aruco_marker_id_right);
        RCLCPP_INFO_STREAM(this->get_logger(), "marker_topic_left" << marker_topic_left);
        RCLCPP_INFO_STREAM(this->get_logger(), "marker_topic_left" << marker_topic_left);
        RCLCPP_INFO_STREAM(this->get_logger(), "marker_topic_right" << marker_topic_right);

        // Initialize the buffer and listener for TF
        tf_buffer = std::make_shared<tf2_ros::Buffer>(this->get_clock());
        tf_listener = std::make_shared<tf2_ros::TransformListener>(*tf_buffer);

        pose_array_left_sub = this->create_subscription<geometry_msgs::msg::PoseArray>(marker_topic_left, 10,
                            std::bind(&Nav_docking::arucoPoseLeftCallback, this, std::placeholders::_1));

        pose_array_right_sub = this->create_subscription<geometry_msgs::msg::PoseArray>(marker_topic_right, 10,
                            std::bind(&Nav_docking::arucoPoseRightCallback, this, std::placeholders::_1));

        // Create a publisher for Nav2 goal
        cmd_vel_pub = this->create_publisher<geometry_msgs::msg::Twist>("cmd_vel_final", 10);
        
        auto period = std::chrono::milliseconds(1000 / publish_rate);  // 1000 ms / rate (Hz)

        front_timer_ = this->create_wall_timer(
        period,
        std::bind(&Nav_docking::frontMarkerCmdVelPublisher, this));

        side_timer_ = this->create_wall_timer(
        period,
        std::bind(&Nav_docking::sideMarkerCmdVelPublisher, this));

    }

    rclcpp_action::GoalResponse Nav_docking::handle_goal(
        const rclcpp_action::GoalUUID &uuid,
        std::shared_ptr<const Dock::Goal> goal)
    {
        RCLCPP_INFO(this->get_logger(), "Received a goal request with dock_request: %d", goal->dock_request);

        // Validate the goal
        if (goal->dock_request)
        {
            RCLCPP_INFO(this->get_logger(), "Goal accepted.");
            return rclcpp_action::GoalResponse::ACCEPT_AND_EXECUTE;
        }
        else
        {
            RCLCPP_WARN(this->get_logger(), "Goal rejected.");
            return rclcpp_action::GoalResponse::REJECT;
        }
    }

    rclcpp_action::CancelResponse Nav_docking::handle_cancel(
        const std::shared_ptr<GoalHandleDock> goal_handle)
    {
        RCLCPP_INFO(this->get_logger(), "Received a request to cancel the goal.");
        return rclcpp_action::CancelResponse::ACCEPT;
    }

    void Nav_docking::handle_accepted(const std::shared_ptr<GoalHandleDock> goal_handle)
    {
        // Start a new thread to execute the goal
        std::thread{std::bind(&Nav_docking::execute, this, goal_handle)}.detach();
    }

    void Nav_docking::execute(const std::shared_ptr<GoalHandleDock> goal_handle)
    {
        RCLCPP_INFO(this->get_logger(), "Executing goal...");

        const auto goal = goal_handle->get_goal();
        auto feedback = std::make_shared<Dock::Feedback>();
        auto result = std::make_shared<Dock::Result>();

        // Simulated docking process
        for (int i = 0; i <= 100; i += 20)
        {
            if (goal_handle->is_canceling())
            {
                RCLCPP_INFO(this->get_logger(), "Goal canceled.");
                goal_handle->canceled(result);
                return;
            }

            // Provide feedback
            feedback->distance = static_cast<double>(100 - i);
            goal_handle->publish_feedback(feedback);
            RCLCPP_INFO(this->get_logger(), "Feedback: distance = %.2f", feedback->distance);

            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }

        // Complete the goal
        result->success = true;
        goal_handle->succeed(result);
        RCLCPP_INFO(this->get_logger(), "Goal succeeded.");
    }


    double Nav_docking::calculate(double error, double& prev_error, 
                               double kp, double ki, double kd, double callback_duration, 
                               double max_output, double min_output, double min_error)
    {
        // If error is within threshold, return 0
        if (std::abs(error) <= min_error || prev_error == 0.0) {
            return 0.0;
        }

        // Calculate integral
        double integral = error * callback_duration;

        // Calculate derivative
        double derivative = (error - prev_error) / callback_duration;

        // Calculate PID output
        double output = kp * error + ki * integral + kd * derivative;

        // Clamp the output to the range [-max_output, max_output]
        if (output > max_output) {
            output = max_output;
        } 
        else if (output < -max_output) {
            output = -max_output;
        }

        // Enforce minimum output magnitude, keeping the sign of the output
        if (std::abs(output) < min_output) {
            output = (output > 0) ? min_output : -min_output;
        }

        return output;
    }

    int Nav_docking::extractMarkerIds(const geometry_msgs::msg::Pose& pose, const std::string& frame_id)
    {
        // Use regex to capture the marker ID from frame_id
        std::regex marker_id_regex("aruco_marker_(\\d+)");
        std::smatch match;
        int marker_id = -1;  // Initialize with a default invalid marker ID

        if (std::regex_search(frame_id, match, marker_id_regex) && match.size() > 1)
        {
            marker_id = std::stoi(match[1].str());
            // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "Detected marker ID: %d", marker_id);
        }
        else
        {
            RCLCPP_WARN(rclcpp::get_logger("MarkerIDLogger"), "Could not extract marker ID from frame_id: %s", frame_id.c_str());
        }
        
        return marker_id;
    }


    void Nav_docking::arucoPoseFrontCallback(const geometry_msgs::msg::PoseArray::SharedPtr msg)
    {
        geometry_msgs::msg::TransformStamped cameraToBase_link;
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_left);
        this->get_parameter("aruco_distance_offset", aruco_distance_offset);
        this->get_parameter("aruco_left_right_offset", aruco_left_right_offset);
        try
        {
            //  Aruco marker to the base_link
            cameraToBase_link = tf_buffer->lookupTransform(base_frame, camera_left_frame, tf2::TimePointZero, tf2::durationFromSec(2));

            for (int i = 0; i < msg->poses.size(); i++)
            {
                found_aruco_marker_id_left = extractMarkerIds(msg->poses[i], msg->header.frame_id);  // Extract marker ID from frame
                // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "Detected marker ID: %d", found_aruco_marker_id_left);
                // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "desiredmarker ID: %d", desired_aruco_marker_id_left);

                if (found_aruco_marker_id_left == desired_aruco_marker_id_left)  // Check if aruco makrer matches desired marker
                {
                    marker_time_left = this->now();
                    double marker_tx = msg->poses[i].position.x;
                    double marker_ty = msg->poses[i].position.y;
                    double marker_tz = msg->poses[i].position.z;

                    double marker_rx = msg->poses[i].orientation.x;
                    double marker_ry = msg->poses[i].orientation.y;
                    double marker_rz = msg->poses[i].orientation.z;
                    double marker_rw = msg->poses[i].orientation.w;

                    tf2::Quaternion camera_q(
                        cameraToBase_link.transform.rotation.x,
                        cameraToBase_link.transform.rotation.y,
                        cameraToBase_link.transform.rotation.z,
                        cameraToBase_link.transform.rotation.w);

                    tf2::Transform camera_transform(camera_q, tf2::Vector3(
                        cameraToBase_link.transform.translation.x,
                        cameraToBase_link.transform.translation.y,
                        cameraToBase_link.transform.translation.z));

                    tf2::Vector3 marker_t(marker_tx, marker_ty, marker_tz);
                    // Save marker transform x y z
                    front_transformed_marker_t = camera_transform * marker_t;

                    // Combine orientations
                    tf2::Quaternion marker_q(marker_rx, marker_ry, marker_rz, marker_rw);
                    tf2::Quaternion combined_q = camera_q * marker_q;  // Quaternion multiplication

                    // 180-degree yaw adjustment
                    tf2::Quaternion yaw_180_q;
                    yaw_180_q.setRPY(0, 0, M_PI);  // Roll=0, Pitch=0, Yaw=180 degrees (π radians)
                    tf2::Quaternion final_q = combined_q * yaw_180_q;  // First combined orientation, then yaw adjustment
                    tf2::Matrix3x3(final_q).getRPY(front_roll, front_pitch, front_yaw);
                } // end of if for matching marker ids
            } // end of for loop
            // RCLCPP_INFO_STREAM(rclcpp::get_logger("nav_docking"), "frame ID: " << msg->header.frame_id);
        }  // end of try
        catch (tf2::TransformException &ex)
        {
            std::stringstream message;
            message << "Could not transform aruco_" << desired_aruco_marker_id_left << " to base_link: " << ex.what();
            RCLCPP_WARN(this->get_logger(), "%s", message.str().c_str());
            return;
        }

    }

    void Nav_docking::arucoPoseLeftCallback(const geometry_msgs::msg::PoseArray::SharedPtr msg)
    {
        this->get_parameter("desired_aruco_marker_id_left", desired_aruco_marker_id_left);
        this->get_parameter("aruco_distance_offset_dual", aruco_distance_offset_dual);
        this->get_parameter("aruco_center_offset_dual", aruco_center_offset_dual);
        geometry_msgs::msg::TransformStamped cameraToBase_link;
        try
        {
            //  Aruco marker to the base_link
            cameraToBase_link = tf_buffer->lookupTransform(base_frame, camera_left_frame, tf2::TimePointZero, tf2::durationFromSec(2));

            for (int i = 0; i < msg->poses.size(); i++)
            {
                found_aruco_marker_id_left = extractMarkerIds(msg->poses[i], msg->header.frame_id);  // Extract marker ID from frame
                // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "Detected marker ID: %d", found_aruco_marker_id_left);
                // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "desiredmarker ID: %d", desired_aruco_marker_id_left);

                if (found_aruco_marker_id_left == desired_aruco_marker_id_left)  // Check if aruco makrer matches desired marker
                {
                    marker_time_left = this->now();
                    double marker_tx = msg->poses[i].position.x;
                    double marker_ty = msg->poses[i].position.y;
                    double marker_tz = msg->poses[i].position.z;

                    double marker_rx = msg->poses[i].orientation.x;
                    double marker_ry = msg->poses[i].orientation.y;
                    double marker_rz = msg->poses[i].orientation.z;
                    double marker_rw = msg->poses[i].orientation.w;

                    tf2::Quaternion camera_q(
                        cameraToBase_link.transform.rotation.x,
                        cameraToBase_link.transform.rotation.y,
                        cameraToBase_link.transform.rotation.z,
                        cameraToBase_link.transform.rotation.w);

                    tf2::Transform camera_transform(camera_q, tf2::Vector3(
                        cameraToBase_link.transform.translation.x,
                        cameraToBase_link.transform.translation.y,
                        cameraToBase_link.transform.translation.z));

                    tf2::Vector3 marker_t(marker_tx, marker_ty, marker_tz);
                    // Save marker transform x y z
                    left_transformed_marker_t = camera_transform * marker_t;

                    // Combine orientations
                    tf2::Quaternion marker_q(marker_rx, marker_ry, marker_rz, marker_rw);
                    tf2::Quaternion combined_q = camera_q * marker_q;  // Quaternion multiplication

                    // 180-degree yaw adjustment
                    tf2::Quaternion yaw_180_q;
                    yaw_180_q.setRPY(0, 0, M_PI);  // Roll=0, Pitch=0, Yaw=180 degrees (π radians)
                    tf2::Quaternion final_q = combined_q * yaw_180_q;  // First combined orientation, then yaw adjustment
                    tf2::Matrix3x3(final_q).getRPY(left_roll, left_pitch, left_yaw);
                } // end of if for matching marker ids
            } // end of for loop
            // RCLCPP_INFO_STREAM(rclcpp::get_logger("nav_docking"), "frame ID: " << msg->header.frame_id);
        }  // end of try 
        catch (tf2::TransformException &ex)
        {
            std::stringstream message;
            message << "Could not transform aruco_" << desired_aruco_marker_id_left << " to base_link: " << ex.what();
            RCLCPP_WARN(this->get_logger(), "%s", message.str().c_str());
            return;
        }
    }

    void Nav_docking::arucoPoseRightCallback(const geometry_msgs::msg::PoseArray::SharedPtr msg)
    {
        this->get_parameter("desired_aruco_marker_id_right", desired_aruco_marker_id_right);
        this->get_parameter("aruco_distance_offset_dual", aruco_distance_offset_dual);
        this->get_parameter("aruco_center_offset_dual", aruco_center_offset_dual);
        geometry_msgs::msg::TransformStamped cameraToBase_link;
        try
        {
            //  Aruco marker to the base_link
            cameraToBase_link = tf_buffer->lookupTransform(base_frame, camera_right_frame, tf2::TimePointZero, tf2::durationFromSec(2));

            for (int i = 0; i < msg->poses.size(); i++)
            {
                found_aruco_marker_id_right = extractMarkerIds(msg->poses[i], msg->header.frame_id);  // Extract marker ID from frame
                // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "Detected marker ID: %d", found_aruco_marker_id_right);
                // RCLCPP_INFO(rclcpp::get_logger("MarkerIDLogger"), "desiredmarker ID: %d", desired_aruco_marker_id_right);

                if (found_aruco_marker_id_right == desired_aruco_marker_id_right)  // Check if aruco makrer matches desired marker
                {
                    marker_time_right = this->now();
                    double marker_tx = msg->poses[i].position.x;
                    double marker_ty = msg->poses[i].position.y;
                    double marker_tz = msg->poses[i].position.z;

                    double marker_rx = msg->poses[i].orientation.x;
                    double marker_ry = msg->poses[i].orientation.y;
                    double marker_rz = msg->poses[i].orientation.z;
                    double marker_rw = msg->poses[i].orientation.w;

                    tf2::Quaternion camera_q(
                        cameraToBase_link.transform.rotation.x,
                        cameraToBase_link.transform.rotation.y,
                        cameraToBase_link.transform.rotation.z,
                        cameraToBase_link.transform.rotation.w);

                    tf2::Transform camera_transform(camera_q, tf2::Vector3(
                        cameraToBase_link.transform.translation.x,
                        cameraToBase_link.transform.translation.y,
                        cameraToBase_link.transform.translation.z));

                    tf2::Vector3 marker_t(marker_tx, marker_ty, marker_tz);
                    // Save marker transform x y z
                    right_transformed_marker_t = camera_transform * marker_t;

                    // Combine orientations
                    tf2::Quaternion marker_q(marker_rx, marker_ry, marker_rz, marker_rw);
                    tf2::Quaternion combined_q = camera_q * marker_q;  // Quaternion multiplication

                    // 180-degree yaw adjustment
                    tf2::Quaternion yaw_180_q;
                    yaw_180_q.setRPY(0, 0, M_PI);  // Roll=0, Pitch=0, Yaw=180 degrees (π radians)
                    tf2::Quaternion final_q = combined_q * yaw_180_q;  // First combined orientation, then yaw adjustment
                    tf2::Matrix3x3(final_q).getRPY(right_roll, right_pitch, right_yaw);
                } // end of if for matching marker ids
            } // end of for loop
            // RCLCPP_INFO_STREAM(rclcpp::get_logger("nav_docking"), "frame ID: " << msg->header.frame_id);
        }  // end of try
        catch (tf2::TransformException &ex)
        {
            std::stringstream message;
            message << "Could not transform aruco_" << desired_aruco_marker_id_right << " to base_link: " << ex.what();
            RCLCPP_WARN(this->get_logger(), "%s", message.str().c_str());
            return;
        }
    }

    void Nav_docking::frontMarkerCmdVelPublisher()
    {
        rclcpp::Time current_time = this->now();
        geometry_msgs::msg::Twist twist_msg;
        double marker_x;
        double marker_y;
        double marker_z;
        double error_x;
        double error_y;
        double error_left_yaw;
        // Calculate dt as the duration since the last loop
        rclcpp::Duration duration = current_time - marker_time_left;
        callback_duration_left = duration.seconds();  // seconds as a double
        duration = current_time - marker_time_right;
        callback_duration_right = duration.seconds();  // seconds as a double
        RCLCPP_INFO(this->get_logger(), "front camera callback_duration: %f", callback_duration_left);

        // stage_4_docking_status = true;
        // Calculate the error

        if (callback_duration_left < callback_duration_right)
        {
            marker_x = left_transformed_marker_t.x();
            marker_y = left_transformed_marker_t.y();
            marker_z = left_transformed_marker_t.z();
            error_x = marker_x - aruco_distance_offset;
            error_y = marker_y - aruco_left_right_offset;
            error_left_yaw = left_yaw;
        }
        else 
        {
            marker_x = right_transformed_marker_t.x();
            marker_y = right_transformed_marker_t.y();
            marker_z = right_transformed_marker_t.z();
            error_x = marker_x - aruco_distance_offset;
            error_y = marker_y + aruco_left_right_offset;
            error_left_yaw = right_yaw;
        }

        if ((callback_duration_left < marker_delay_threshold_sec || callback_duration_right < marker_delay_threshold_sec) &&
             stage_4_docking_status == false) // Check for marker delay and status
        {
            // RCLCPP_INFO(this->get_logger(), "callback_duration: %f", callback_duration_left);
            // Use PID function to calculate controlled velocities
            if (fabs(error_y) < docking_y_axis_threshold)  // Check if robot is alligned
            {
                twist_msg.linear.x = calculate(error_x, prev_error_x,
                                                kp_x, ki_x, kd_x, callback_duration_left, max_speed, min_speed, min_error);
                twist_msg.linear.y = calculate(error_y, prev_error_y,
                                                kp_y, ki_y, kd_y, callback_duration_left, max_speed, min_speed, min_error);
                twist_msg.angular.z = calculate(error_left_yaw, prev_error_left_yaw,
                                                kp_z, ki_z, kd_z, callback_duration_left, max_speed, min_speed, min_error);
                RCLCPP_INFO_STREAM(this->get_logger(), "front transform x aruco_distance_offset: " << aruco_distance_offset);
                RCLCPP_INFO_STREAM(this->get_logger(), "front transform x error #####: " << error_x);
                RCLCPP_INFO_STREAM(this->get_logger(), "twist_pub:x " << twist_msg.linear.x);
            }
            else  // align robot
            {
                twist_msg.linear.x = 0;
                twist_msg.linear.y = calculate(error_y, prev_error_y,
                                                kp_y, ki_y, kd_y, callback_duration_left, max_speed, min_speed, min_error);
                twist_msg.angular.z = calculate(error_left_yaw, prev_error_left_yaw,
                                                kp_z, ki_z, kd_z, callback_duration_left, max_speed, min_speed, min_error);

                RCLCPP_INFO_STREAM(this->get_logger(), "front transform y aruco_left_right_offset: " << aruco_left_right_offset);
                RCLCPP_INFO_STREAM(this->get_logger(), "front transform y error #####: " << error_y);
                RCLCPP_INFO_STREAM(this->get_logger(), "twist_pub:y " << twist_msg.linear.y );
            }

            // Publish twist if error is above threshold and set status
            if (fabs(error_x) > min_error || fabs(error_y) > docking_y_axis_threshold || fabs(error_left_yaw > min_error/2))
            {
                cmd_vel_pub->publish(twist_msg);
                stage_4_docking_status = false;
                RCLCPP_INFO_STREAM(this->get_logger(), "Publish pub:x " << twist_msg.linear.x);
                RCLCPP_INFO_STREAM(this->get_logger(), "Pubish pub:y " << twist_msg.linear.y);
            }
            else
            {
                twist_msg.linear.x = 0.0;
                twist_msg.linear.y = 0.0;
                twist_msg.angular.z = 0.0;
                cmd_vel_pub->publish(twist_msg);
                stage_4_docking_status = true;  // publish docking status
                RCLCPP_INFO_STREAM(this->get_logger(), "stage_4_docking_status true " << stage_4_docking_status);
            }
        }
        else
        {
            twist_msg.linear.x = 0.0;
            twist_msg.linear.y = 0.0;
            twist_msg.angular.z = 0.0;
            cmd_vel_pub->publish(twist_msg);
            // RCLCPP_INFO_STREAM(this->get_logger(), "PAUSE 0 DELAY too long or status " << stage_4_docking_status);
        }

        prev_error_x = error_x;
        prev_error_y = error_y;
        prev_error_left_yaw = error_left_yaw;

    }

    void Nav_docking::sideMarkerCmdVelPublisher()
    {
        rclcpp::Time current_time = this->now();
        geometry_msgs::msg::Twist twist_msg;
        // Calculate dt as the duration since the last loop
        rclcpp::Duration duration_left = current_time - marker_time_left;
        rclcpp::Duration duration_right = current_time - marker_time_right;
        callback_duration_side = std::max(duration_left.seconds(), duration_right.seconds());  // seconds as a double

        if (callback_duration_side > docking_reset_threshold_sec)
            stage_4_docking_status = false;

        RCLCPP_INFO(this->get_logger(), "side camera callback_duration: %f", callback_duration_side);
        RCLCPP_INFO_STREAM(this->get_logger(), "stage_4_docking_status: " << stage_4_docking_status);
        RCLCPP_INFO_STREAM(this->get_logger(), "kp_x: " << kp_x);

        // Calculate the error
        double left_marker_x = left_transformed_marker_t.x();
        double left_marker_y = left_transformed_marker_t.y();
        double right_marker_x = right_transformed_marker_t.x();
        double right_marker_y = right_transformed_marker_t.y();
        double left_marker_z = left_transformed_marker_t.z();
        double right_marker_z = right_transformed_marker_t.z();
        double distance = (left_marker_x) + (right_marker_x) / 2;
        double rotation = (right_marker_x - left_marker_x);
        double center =  (left_marker_y - -right_marker_y);
        double error_dist = distance - aruco_distance_offset_dual; // distance - aruco_distance_offset_dual;
        double error_center = center - aruco_center_offset_dual;
        double error_rotation = rotation;

        // Check for marker delay and status
        if (callback_duration_side < marker_delay_threshold_sec && stage_4_docking_status == true)
        {
            // Use PID function to calculate controlled velocities
            if (fabs(error_dist) > min_docking_error ||
                fabs(error_center) > min_error || 
                fabs(error_rotation) > min_docking_error)
            {
                twist_msg.linear.x = calculate(error_dist, prev_error_dist,
                                                kp_x, ki_x, kd_x, callback_duration_side, max_speed, min_speed, min_docking_error);
                twist_msg.linear.y = calculate(error_center, prev_error_center,
                                                kp_y, ki_y, kd_y, callback_duration_side, max_speed/2, min_speed/2, min_error);
                twist_msg.angular.z = calculate( error_rotation, prev_error_rotation,
                                                kp_z, ki_z, kd_z, callback_duration_side, max_speed, min_speed, min_docking_error);
                cmd_vel_pub->publish(twist_msg);
                stage_5_docking_status = false;

                // RCLCPP_INFO_STREAM(this->get_logger(), "side transform dist aruco_distance_offset_side: " << aruco_distance_offset_dual);
                RCLCPP_INFO_STREAM(this->get_logger(), "dual transform dist error #####: " << error_dist);
                // RCLCPP_INFO_STREAM(this->get_logger(), "side transform error_center #####: " << error_center);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual transform error_rotation #####: " << error_rotation);

                

                // RCLCPP_INFO_STREAM(this->get_logger(), "twist_pub:y: " << twist_msg.linear.y);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual twist_pub:anglular Z: " << twist_msg.angular.z);
                RCLCPP_INFO_STREAM(this->get_logger(), "dual right_marker_x: " << right_marker_x);
                RCLCPP_INFO_STREAM(this->get_logger(), "dual left_marker_x: " << left_marker_x);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual transform error_center #####: " << error_center);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual twist_pub:y: " << twist_msg.linear.y);


                // RCLCPP_INFO_STREAM(this->get_logger(), "dual right_marker_y: " << right_marker_y);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual left_marker_y: " << left_marker_y);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual right_marker_z: " << right_marker_z);
                // RCLCPP_INFO_STREAM(this->get_logger(), "dual left_marker_z: " << left_marker_z);
            }
            else
            {
                twist_msg.linear.x = 0.0;
                twist_msg.linear.y = 0.0;
                twist_msg.angular.z = 0.0;
                cmd_vel_pub->publish(twist_msg);
                stage_5_docking_status = true;  // publish docking status
                RCLCPP_INFO_STREAM(this->get_logger(), "DOCKING COMPLETE" << "error_dist: " << error_dist << 
                                                                            "error_center: " << error_center);
            }

        RCLCPP_INFO_STREAM(this->get_logger(), "dual transform dist error #####: " << error_dist);
        RCLCPP_INFO_STREAM(this->get_logger(), "dual twist_pub:x: " << twist_msg.linear.x);
        RCLCPP_INFO_STREAM(this->get_logger(), "dual left_marker_y: " << (left_marker_y - aruco_distance_offset_dual));
        RCLCPP_INFO_STREAM(this->get_logger(), "dual right_marker_y: " << (-right_marker_y - aruco_distance_offset_dual));
        RCLCPP_INFO_STREAM(this->get_logger(), "dual transform error_dist #####: " << error_dist);
        }
        if (stage_5_docking_status == true)
        {
            // RCLCPP_INFO_STREAM(this->get_logger(), "dual transform dist error #####: " << error_dist);
            // RCLCPP_INFO_STREAM(this->get_logger(), "dual transform center error #####: " << error_center);
            // RCLCPP_INFO_STREAM(this->get_logger(), "dual transform rotation error #####: " << error_rotation);
            RCLCPP_INFO_STREAM(this->get_logger(), "dual transform dist error #####: " << error_dist);
            RCLCPP_INFO_STREAM(this->get_logger(), "dual twist_pub:x: " << twist_msg.linear.x);
            RCLCPP_INFO_STREAM(this->get_logger(), "dual left_marker_y: " << (left_marker_y - aruco_distance_offset_dual));
            RCLCPP_INFO_STREAM(this->get_logger(), "dual right_marker_y: " << (-right_marker_y - aruco_distance_offset_dual));
            RCLCPP_INFO_STREAM(this->get_logger(), "dual transform error_dist #####: " << error_dist);

            RCLCPP_INFO_STREAM(this->get_logger(), "------- DOCKING COMPLETE ------");
            cmd_vel_pub->publish(twist_msg);
        }

        prev_error_dist = error_dist;
        prev_error_center = error_center;
        prev_error_rotation = error_rotation;
    }
} // namespace nav_docking

int main(int argc, char *argv[])
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<nav_docking::Nav_docking>());
    rclcpp::shutdown();
    return 0;
}
