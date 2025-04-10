#include "nav_control/nav_control.h"

namespace nav_control
{
    Nav_control::Nav_control()
        : Node("nav_control")
    {
        // Declare node parameters
        this->declare_parameter<std::string>("input_topic", "input_topic");
        this->declare_parameter<std::string>("output_topic", "output_topic");
        this->declare_parameter<std::string>("mode_drive", "DOCKING");
        this->declare_parameter<float>("LENGTH_ROTATION_CENTER_SOLO", 0.0);
        this->declare_parameter<float>("LENGTH_ROTATION_CENTER_DOCKING", 0.15);
        this->declare_parameter<float>("LENGTH_ROTATION_CENTER_COMBINE_CHAIR", 0.3);
        // Retrieve parameter values
        this->get_parameter("input_topic", input_topic);
        this->get_parameter("output_topic", output_topic);
        this->get_parameter("mode_drive", mode_drive);
        this->get_parameter("LENGTH_ROTATION_CENTER_SOLO", LENGTH_ROTATION_CENTER_SOLO);
        this->get_parameter("LENGTH_ROTATION_CENTER_DOCKING", LENGTH_ROTATION_CENTER_DOCKING);
        this->get_parameter("LENGTH_ROTATION_CENTER_COMBINE_CHAIR", LENGTH_ROTATION_CENTER_COMBINE_CHAIR);

        RCLCPP_INFO_STREAM(this->get_logger(), "mode_drive: " << mode_drive);

        cmd_vel_sub = this->create_subscription<geometry_msgs::msg::Twist>(input_topic, 1,
                            std::bind(&Nav_control::cmd_velCallback, this, std::placeholders::_1));
        // Create a publisher for cmd_vel
        cmd_vel_pub = this->create_publisher<geometry_msgs::msg::Twist>(output_topic, 1);
        
    }

    float Nav_control::rotationCenter(std::string mode_drive)
    {
        if (mode_drive== "SOLO")
            LENGTH_ROTATION_CENTER = LENGTH_ROTATION_CENTER_SOLO;
        else if (mode_drive== "DOCKING")
            LENGTH_ROTATION_CENTER = LENGTH_ROTATION_CENTER_DOCKING;
        else if (mode_drive== "COMBINE_CHAIR")
            LENGTH_ROTATION_CENTER = LENGTH_ROTATION_CENTER_COMBINE_CHAIR;
        else
        {
            LENGTH_ROTATION_CENTER = LENGTH_ROTATION_CENTER_DOCKING;
            RCLCPP_ERROR_STREAM(rclcpp::get_logger("ERROR"), "Drive mode invalid.");
        }

        return LENGTH_ROTATION_CENTER;
    }

    // Function to clamp values
    double Nav_control::clamp_velocity(double value)
    {
        if (value == 0.0) return 0.0;
        return std::max(-max_speed, std::min(max_speed, value));
    }

    void Nav_control::cmd_velCallback(const geometry_msgs::msg::Twist::SharedPtr msg)
    {
        geometry_msgs::msg::Vector3 linear_vel_msg;
        geometry_msgs::msg::Vector3 angular_vel_msg;
        geometry_msgs::msg::Twist vel_msg;

        this->get_parameter("mode_drive", mode_drive);
        // Check if mode_drive changed
        if (previous_mode_drive != mode_drive)
        {
            LENGTH_ROTATION_CENTER = Nav_control::rotationCenter(mode_drive);
            previous_mode_drive = mode_drive;

            RCLCPP_INFO_STREAM(rclcpp::get_logger("LENGTH_ROTATION_CENTER: "), mode_drive << ": " << LENGTH_ROTATION_CENTER);
        }

        double x = clamp_velocity(msg->linear.x);
        double y = clamp_velocity(msg->linear.y);
        double z = clamp_velocity(msg->angular.z);

        linear_vel_msg.x = x;
        linear_vel_msg.y = (-z * LENGTH_ROTATION_CENTER) + y;
        linear_vel_msg.z = 0.0;

        angular_vel_msg.x = 0.0;
        angular_vel_msg.y = 0.0;
        angular_vel_msg.z = z;

        vel_msg.linear = linear_vel_msg;
        vel_msg.angular = angular_vel_msg;

        cmd_vel_pub->publish(vel_msg);
    }
} // namespace nav_control


int main(int argc, char *argv[])
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<nav_control::Nav_control>());
    rclcpp::shutdown();
    return 0;
}