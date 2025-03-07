#ifndef NAV_DOCKING_H
#define NAV_DOCKING_H

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


#include "nav_interface/action/dock.hpp"
#include "rclcpp_action/rclcpp_action.hpp"
#include "rclcpp_components/register_node_macro.hpp"


namespace nav_docking
{
    class Nav_docking : public rclcpp::Node
    {
    public:
        Nav_docking();
    private:

        bool enable_callback = false;
        double feedback_distance;

        using Dock = nav_interface::action::Dock;
        using GoalHandleDock = rclcpp_action::ServerGoalHandle<Dock>;

        // Action server
        rclcpp_action::Server<Dock>::SharedPtr action_server_;

        // Goal handling methods
        rclcpp_action::GoalResponse handle_goal(const rclcpp_action::GoalUUID &uuid,
                                                std::shared_ptr<const Dock::Goal> goal);

        rclcpp_action::CancelResponse handle_cancel(const std::shared_ptr<GoalHandleDock> goal_handle);

        void handle_accepted(const std::shared_ptr<GoalHandleDock> goal_handle);

        // Execution of the goal
        void execute(const std::shared_ptr<GoalHandleDock> goal_handle);
        
        void arucoPoseLeftCallback(const geometry_msgs::msg::PoseArray::SharedPtr msg);
        void arucoPoseRightCallback(const geometry_msgs::msg::PoseArray::SharedPtr msg);
        int extractMarkerIds(const geometry_msgs::msg::Pose& pose, const std::string& frame_id);
        double calculate(double error, double& prev_error, 
                               double kp, double ki, double kd, double callback_duration, 
                               double max_output, double min_output, double min_error);
        void frontMarkerCmdVelPublisher();
        void dualMarkerCmdVelPublisher();
        // TF buffer and listener
        std::shared_ptr<tf2_ros::Buffer> tf_buffer;
        std::shared_ptr<tf2_ros::TransformListener> tf_listener;
        rclcpp::Subscription<geometry_msgs::msg::PoseArray>::SharedPtr pose_array_left_sub;
        rclcpp::Subscription<geometry_msgs::msg::PoseArray>::SharedPtr pose_array_right_sub;
        rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_pub;

        std::string marker_topic_left = "aruco_detect/markers_left";
        std::string marker_topic_right = "aruco_detect/markers_right";
        int publish_rate = 30;
        double marker_delay_threshold_sec = 0.2;
        double docking_reset_threshold_sec = 3.0;
        bool stage_4_docking_status=false;
        bool stage_5_docking_status=false;
        bool stage_6_docking_status=false;
        bool confirmed_docking_status=false;

        rclcpp::TimerBase::SharedPtr front_timer_;
        rclcpp::TimerBase::SharedPtr dual_timer_;
        

        std::string base_frame = "base_link";
        std::string camera_left_frame= "camera_front_left_frame";
        std::string camera_right_frame= "camera_front_right_frame";
        int found_aruco_marker_id_left;
        int found_aruco_marker_id_right;

        // front marker offset
        float aruco_distance_offset;
        float aruco_left_right_offset;
        // dual markers offset
        float aruco_distance_offset_dual;
        float aruco_center_offset_dual;
        float aruco_rotation_offset_dual;

        int desired_aruco_marker_id_left;
        int desired_aruco_marker_id_right;

        // Marker variables
        tf2::Vector3 left_transformed_marker_t;
        double left_roll, left_pitch, left_yaw, prev_yaw;

        tf2::Vector3 right_transformed_marker_t;
        double right_roll, right_pitch, right_yaw;

        // PID parameters
        double kp_x = 0.05, ki_x = 0.05, kd_x = 0.05;
        double kp_y = 0.50, ki_y = 0.03, kd_y = 0.04;
        double kp_z = 0.05, ki_z = 0.05, kd_z = 0.05;
        double max_speed = 0.1;
        double min_speed = 0.005;
        // Initialize integral and previous error terms for x and y
        double prev_error_x = 0.0;
        double prev_error_y = 0.0;
        double prev_error_yaw = 0.0;

        double prev_error_dist;
        double prev_error_center;
        double prev_error_rotation;

        rclcpp::Time marker_time_left = this->now();
        rclcpp::Time marker_time_right = this->now();
        double callback_duration; // loop time
        double callback_duration_left; // loop time
        double callback_duration_right; // loop time
        double callback_duration_dual; // loop time
        double min_error = 0.01; // min error of 1cm
        double min_docking_error = 0.0005; // min error of 0.2mm
        double previous_error_center;
    };

} // namespace nav_docking

#endif // NAV_GOAL_H
