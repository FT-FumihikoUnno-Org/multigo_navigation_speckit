#ifndef NAV_CONTROL_H
#define NAV_CONTROL_H

#include <rclcpp/rclcpp.hpp>
#include "geometry_msgs/msg/twist.hpp"
#include <string>
#include <regex>
#include <vector>


namespace nav_control
{
    class Nav_control : public rclcpp::Node
    {
    public:
        Nav_control();
    private:
        float rotationCenter(std::string mode_drive);
        void cmd_velCallback(const geometry_msgs::msg::Twist::SharedPtr msg);

        std::string input_topic = "cmd_vel_final";
        std::string output_topic = "cmd_vel";
        std::string mode_drive = "COMBINE_CHAIR";
        std::string previous_mode_drive;
        float LENGTH_ROTATION_CENTER;
        float LENGTH_ROTATION_CENTER_SOLO;
        float LENGTH_ROTATION_CENTER_DOCKING;
        float LENGTH_ROTATION_CENTER_COMBINE_CHAIR;

        rclcpp::Subscription<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_sub;
        rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_pub;

    };
} // namespace nav_control
#endif // NAV_GOAL_H
