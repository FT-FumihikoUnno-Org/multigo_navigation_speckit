#ifndef NAV_GOAL_H
#define NAV_GOAL_H

#include <rclcpp/rclcpp.hpp>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/buffer.h>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <tf2/transform_datatypes.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include "geometry_msgs/msg/pose.hpp"
#include "geometry_msgs/msg/pose_array.hpp"
#include "geometry_msgs/msg/pose_stamped.hpp"
#include <string>
#include <regex>
#include <vector>


namespace nav_goal
{
    class Nav_goal : public rclcpp::Node
    {
    public:
        Nav_goal();

    private:

        void arucoPoseCallbackLeft(const geometry_msgs::msg::PoseArray::SharedPtr msg);
        void arucoPoseCallbackRight(const geometry_msgs::msg::PoseArray::SharedPtr msg);
        int extractMarkerIds(const geometry_msgs::msg::PoseArray::SharedPtr& pose_array_msg);
        void frontMarkerGoalPublisher();
        // TF buffer and listener
        std::shared_ptr<tf2_ros::Buffer> tf_buffer;
        std::shared_ptr<tf2_ros::TransformListener> tf_listener;
        rclcpp::Subscription<geometry_msgs::msg::PoseArray>::SharedPtr pose_array_sub_left;
        rclcpp::Subscription<geometry_msgs::msg::PoseArray>::SharedPtr pose_array_sub_right;

        // Publisher for the navigation goal
        rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr goal_pub;
        geometry_msgs::msg::PoseStamped goal_msg_left;
        geometry_msgs::msg::PoseStamped goal_msg_right;

        std::string map_frame = "map";
        std::string camera_front_left_frame = "camera_rgb_frame";
        std::string camera_front_right_frame = "camera_rgb_frame";
        std::string marker_topic_front_left = "aruco_detect/markers_front";
        std::string marker_topic_front_right = "aruco_detect/markers_front";
        int desired_aruco_marker_id_left;
        int desired_aruco_marker_id_right;
        int found_aruco_marker_id;
        float aruco_distance_offset = -0.5;
        float aruco_left_right_offset = 0;
        bool stage_3_docking_status = false;

        rclcpp::TimerBase::SharedPtr front_timer;
        int publish_rate = 10;
        double marker_delay_threshold_sec = 0.2;
        float goal_distance_threshold = 0.05;

        rclcpp::Time marker_time_left = this->now();
        rclcpp::Time marker_time_right = this->now();
        double callback_duration_left; // loop time
        double callback_duration_right; // loop time

    };

} // namespace nav_goal

#endif // NAV_GOAL_H
