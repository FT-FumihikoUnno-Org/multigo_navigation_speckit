#ifndef ARUCO_DETECT_H
#define ARUCO_DETECT_H

#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/image.hpp>
#include <sensor_msgs/msg/camera_info.hpp>
#include <geometry_msgs/msg/twist.hpp>
#include <geometry_msgs/msg/transform_stamped.hpp>
#include <tf2_ros/transform_broadcaster.h>
#include <cv_bridge/cv_bridge.h>
#include <opencv2/opencv.hpp>
#include <opencv2/aruco.hpp>
#include <opencv2/highgui.hpp>
#include <opencv2/imgproc.hpp>
#include <iostream>
#include <tf2/LinearMath/Quaternion.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <opencv2/calib3d.hpp>
#include "geometry_msgs/msg/pose.hpp"
#include "geometry_msgs/msg/pose_array.hpp"
#include "geometry_msgs/msg/pose_stamped.hpp"
#include <eigen3/Eigen/Dense>
#include <eigen3/Eigen/Geometry>

namespace aruco_detect
{
    class Aruco_detect : public rclcpp::Node
    {
    public:
        Aruco_detect();

    private:
        // Image and Camera Info Callbacks
        void imageCallback(const sensor_msgs::msg::Image::SharedPtr msg);
        void cameraInfoCallback(const sensor_msgs::msg::CameraInfo::SharedPtr msg);
        void detectArucoMarkers(cv::Mat &image);

        // Subscriptions and Publishers
        rclcpp::Subscription<sensor_msgs::msg::Image>::SharedPtr image_sub;
        rclcpp::Subscription<sensor_msgs::msg::CameraInfo>::SharedPtr camera_info_sub;
        rclcpp::Publisher<geometry_msgs::msg::PoseArray>::SharedPtr pose_array_pub;

        // Choose dictionary
        cv::Ptr<cv::aruco::Dictionary> dictionary = cv::aruco::getPredefinedDictionary(cv::aruco::DICT_6X6_250);

        std::string camera_topic;
        std::string camera_info;
        int desired_aruco_marker_id;
        double marker_width = 0.05;

        //Camera info parameters
        cv::Mat camera_matrix, dist_coeffs;
        std::string frame_id;
        double image_height = 1;
        double image_width = 1;
        bool cam_info_received = false;
        cv::Mat rectification;
        cv::Mat projection;

        // TF broadcaster for sending marker transforms
        std::shared_ptr<tf2_ros::TransformBroadcaster> tf_broadcaster;
        
        bool window_created = false;
        std::string window_name;
        rclcpp::Time previous_time = this->now();
        rclcpp::Time current_time = this->now();
        double previous_duration;
        
    };
} // namespace aruco_detect

#endif // ARUCO_DETECT_H
