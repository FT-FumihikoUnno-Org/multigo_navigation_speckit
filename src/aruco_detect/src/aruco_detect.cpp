#include "aruco_detect/aruco_detect.h"

namespace aruco_detect
{
   Aruco_detect::Aruco_detect()
    : Node("aruco_detect")
    {
        // Declare node parameters
        this->declare_parameter<int>("desired_aruco_marker_id", 0);
        this->declare_parameter<double>("marker_width", 0.05);
        this->declare_parameter<std::string>("camera_topic", "/camera/color/image_raw_front");
        this->declare_parameter<std::string>("camera_info", "/camera/color/camera_info_front");
        // Retrieve parameter values
        this->get_parameter("desired_aruco_marker_id", desired_aruco_marker_id);
        this->get_parameter("marker_width", marker_width);
        this->get_parameter("camera_topic", camera_topic);
        this->get_parameter("camera_info", camera_info);

        RCLCPP_INFO_STREAM(this->get_logger(), "desired_aruco_marker_id: " << desired_aruco_marker_id);
        RCLCPP_INFO_STREAM(this->get_logger(), "marker_width: " << marker_width);
        RCLCPP_INFO_STREAM(this->get_logger(), "camera_topic: " << camera_topic);
        RCLCPP_INFO_STREAM(this->get_logger(), "camera_info: " << camera_info);
        RCLCPP_INFO_STREAM(this->get_logger(), "dictionary ID : " << dictionary);

        image_sub = this->create_subscription<sensor_msgs::msg::Image>(
            camera_topic, 1, 
            std::bind(&Aruco_detect::imageCallback, this, std::placeholders::_1));
        camera_info_sub = this->create_subscription<sensor_msgs::msg::CameraInfo>(
            camera_info, 1, 
            std::bind(&Aruco_detect::cameraInfoCallback, this, std::placeholders::_1));

        pose_array_pub = this->create_publisher<geometry_msgs::msg::PoseArray>("aruco_detect/markers", 10);

        tf_broadcaster = std::make_shared<tf2_ros::TransformBroadcaster>(this);  // Initialize broadcaster
        
        std::stringstream ss;
        ss << "Aruco Markers_" << desired_aruco_marker_id;
        window_name = ss.str(); // Extract the string from the stringstream
        cv::namedWindow(window_name, cv::WINDOW_AUTOSIZE);
    }

    // Callback to receive and store camera intrinsic parameters
    void Aruco_detect::cameraInfoCallback(const sensor_msgs::msg::CameraInfo::SharedPtr msg)
    {
        if (!cam_info_received)
        {
        // Store frame ID
        frame_id = msg->header.frame_id;

        // Image size
        image_height = msg->height;
        image_width = msg->width;

        // Camera matrix
        camera_matrix = (cv::Mat_<double>(3, 3) << 
            msg->k[0], msg->k[1], msg->k[2],
            msg->k[3], msg->k[4], msg->k[5],
            msg->k[6], msg->k[7], msg->k[8]);

        // Distortion coefficients
        dist_coeffs = (cv::Mat_<double>(1, 5) << 
            msg->d[0], msg->d[1], msg->d[2], msg->d[3], msg->d[4]);

        // store the Rectification parameters
        rectification = (cv::Mat_<double>(3, 3) << 
            msg->r[0], msg->r[1], msg->r[2],
            msg->r[3], msg->r[4], msg->r[5],
            msg->r[6], msg->r[7], msg->r[8]);

        // store the Projection parameters
        projection  = (cv::Mat_<double>(3, 4) << 
            msg->p[0], msg->p[1], msg->p[2], msg->p[3],
            msg->p[4], msg->p[5], msg->p[6], msg->p[7],
            msg->p[8], msg->p[9], msg->p[10], msg->p[11]);

        cam_info_received = true;  // set to true.  
        }
        // RCLCPP_INFO_STREAM(this->get_logger(), "Camera Info: frame_id=" << frame_id.c_str()<<  " image width " << image_width
        //                                         << " image height "<< image_height);
    }


    void Aruco_detect::imageCallback(const sensor_msgs::msg::Image::SharedPtr msg)
    {
        if (cam_info_received)
        {
            this->get_parameter("desired_aruco_marker_id", desired_aruco_marker_id);
            this->get_parameter("marker_width", marker_width);
            this->get_parameter("camera_topic", camera_topic);
            this->get_parameter("camera_info", camera_info);
            // Convert ROS image message to OpenCV image
            cv_bridge::CvImagePtr cv_ptr;
            try
            {
                cv_ptr = cv_bridge::toCvCopy(msg, sensor_msgs::image_encodings::MONO8);
            }
            catch (cv_bridge::Exception& e)
            {
                RCLCPP_ERROR(this->get_logger(), "cv_bridge exception: %s", e.what());
                return;
            }
            detectArucoMarkers(cv_ptr->image);
        }
    }

    void Aruco_detect::detectArucoMarkers(cv::Mat &image)
    {
        std::vector<int> markerIds;
        std::vector<std::vector<cv::Point2f>> markerCorners;
        std::vector<cv::Vec3d> rvecs, tvecs;
        geometry_msgs::msg::Pose pose;
        geometry_msgs::msg::TransformStamped transformStamped;
        current_time = this->now();

        // Prepare a PoseArray message to publish all marker poses
        geometry_msgs::msg::PoseArray pose_array_msg;

        // RCLCPP_INFO_STREAM(this->get_logger(), "frame ID:  "<< frame_id );

        // Check if camera parameters are initialized
        if (camera_matrix.empty() || dist_coeffs.empty())
        {
            RCLCPP_ERROR(this->get_logger(), "Camera matrix or distortion coefficients are not initialized.");
            return;
        }

        // Detect the markers in the frame
        cv::aruco::detectMarkers(image, dictionary, markerCorners, markerIds);

        // If markers are detected, estimate their poses
        if (!markerIds.empty()) 
        {
            this->get_parameter("desired_aruco_marker_id", desired_aruco_marker_id);
            cv::aruco::estimatePoseSingleMarkers(markerCorners, marker_width, camera_matrix, dist_coeffs, rvecs, tvecs);
            cv::aruco::drawDetectedMarkers(image, markerCorners, markerIds);

            for (size_t i = 0; i < markerIds.size(); i++)
            {
                if (markerIds[i] == desired_aruco_marker_id)
                {
                    pose_array_msg.header.stamp = current_time;
                    pose_array_msg.header.frame_id = "aruco_marker_" + std::to_string(markerIds[i]);
                    cv::aruco::drawAxis(image, camera_matrix, dist_coeffs, rvecs[i], tvecs[i], marker_width);

                    // Set pose.
                    pose.position.x = tvecs[i][2];
                    pose.position.y = -tvecs[i][0];
                    pose.position.z = tvecs[i][1];

                    // Convert rotation vector to rotation matrix
                    cv::Mat rotation_matrix;
                    cv::Rodrigues(rvecs[i], rotation_matrix);
                    // Ensure the matrix is in double precision
                    if (rotation_matrix.type() != CV_64F)
                        rotation_matrix.convertTo(rotation_matrix, CV_64F);
                    // Convert rotation matrix to Eigen::Matrix3d
                    Eigen::Matrix3d rot;
                    for (int row = 0; row < 3; ++row)
                    {
                        for (int col = 0; col < 3; ++col)
                        {
                            rot(row, col) = rotation_matrix.at<double>(row, col);
                        }
                    }
                    // Define the conversion from the camera (OpenCV) coordinate system to the ROS coordinate system
                    Eigen::Matrix3d cv_to_ros;
                    cv_to_ros << 0,  0, 1,
                                -1, 0, 0,
                                0,-1, 0;
                    // Apply the full coordinate transformation (sandwich transformation)
                    rot = cv_to_ros * rot * cv_to_ros.transpose();
                    // Convert the transformed rotation matrix to quaternion using Eigen
                    Eigen::Quaterniond eigen_quat(rot);
                    tf2::Quaternion quat(eigen_quat.x(), eigen_quat.y(), eigen_quat.z(), eigen_quat.w());
                    // Additional 180° roll rotation offset (roll around x-axis)
                    tf2::Quaternion offset;
                    offset.setRPY(0, M_PI, 0);  // 180° in radians
                    quat = quat * offset;
                    quat.normalize();
                    // Set the quaternion to the pose orientation
                    pose.orientation.x = quat.x();
                    pose.orientation.y = quat.y();
                    pose.orientation.z = quat.z();
                    pose.orientation.w = quat.w();

                    // Overlay the marker position text on the image
                    std::ostringstream oss_1;
                    oss_1 << std::fixed << std::setprecision(2)
                                        << "Marker ID: " << desired_aruco_marker_id 
                                        << " Pos: (" 
                                        << pose.position.x << ", " 
                                        << pose.position.y << ", " 
                                        << pose.position.z << ") ";
                    std::string position_text = oss_1.str();
                    cv::putText(image, position_text, cv::Point(10, 80), cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(255, 0, 0), 1);

                    // RCLCPP_INFO(this->get_logger(), "Marker ID: %d - Translation: [Left Right inverted %f, Height inverted %f, Distance %f], Rotation: [%f, %f, %f]",
                    //     markerIds[i], tvecs[i][0], tvecs[i][1], tvecs[i][2], -rvecs[i][0], -rvecs[i][1], rvecs[i][2]);

                    // Broadcast the marker pose as a transform
                    transformStamped.header.stamp = current_time;
                    transformStamped.header.frame_id = frame_id;  // Camera frame
                    transformStamped.child_frame_id = "aruco_marker_" + std::to_string(markerIds[i]);  // Marker ID as frame
                    transformStamped.transform.translation.x = pose.position.x;
                    transformStamped.transform.translation.y = pose.position.y;
                    transformStamped.transform.translation.z = pose.position.z;
                    transformStamped.transform.rotation.x = pose.orientation.x;
                    transformStamped.transform.rotation.y = pose.orientation.y;
                    transformStamped.transform.rotation.z = pose.orientation.z;
                    transformStamped.transform.rotation.w = pose.orientation.w;

                    tf_broadcaster->sendTransform(transformStamped);
                    pose_array_msg.poses.push_back(pose);
                }
            }

            // Publish the PoseArray (this will be displayed in RViz)
            pose_array_pub->publish(pose_array_msg);
        }
        else 
        {
            // RCLCPP_WARN(this->get_logger(), "No markers detected.");
        }

        // Calculate FPS (frames per second)
        float fps = 0.0f;
        int weighted_avg = 10;
        rclcpp::Duration duration_fps = (current_time - previous_time);
        float duration = (duration_fps.seconds() + (previous_duration * (weighted_avg-1))) / weighted_avg;
        if (duration > 0.0f) 
            fps = 1.0f / duration;
        previous_time = current_time;
        previous_duration = duration;
        std::ostringstream stream;
        stream << std::fixed << std::setprecision(2) << fps;
        std::string fps_text = "FPS: " + stream.str();
        cv::putText(image, fps_text, cv::Point(10, 50), cv::FONT_HERSHEY_SIMPLEX, 
                    0.5, cv::Scalar(255), 1); 
        // Display the image with detected markers and axes
        cv::imshow(window_name, image);
        cv::waitKey(1);
    }


} // namespace aruco_detect

int main(int argc, char *argv[])
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<aruco_detect::Aruco_detect>());
    rclcpp::shutdown();
    return 0;
}

