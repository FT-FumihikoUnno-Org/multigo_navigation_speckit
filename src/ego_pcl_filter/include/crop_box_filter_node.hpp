#ifndef CROP_BOX_FILTER_NODE_HPP
#define CROP_BOX_FILTER_NODE_HPP

#include <memory>
#include <string>
#include <pcl/filters/crop_box.h>
#include <pcl_conversions/pcl_conversions.h>
#include <sensor_msgs/msg/point_cloud2.hpp>
#include <rclcpp/rclcpp.hpp>
#include <tf2_ros/transform_listener.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <geometry_msgs/msg/transform_stamped.hpp>
#include <tf2_ros/buffer.h>
#include <pcl_ros/transforms.hpp>
#include <pcl/point_types.h>

class CropBoxFilterNode : public rclcpp::Node
{
public:
    CropBoxFilterNode();

private:
    // Declare parameters
    float min_x_, max_x_, min_y_, max_y_, min_z_, max_z_;
    bool keep_organized_, negative_;
    std::string input_frame_, output_frame_, input_topic, output_topic;

    // Subscriber and publisher
    rclcpp::Subscription<sensor_msgs::msg::PointCloud2>::SharedPtr sub_;
    rclcpp::Publisher<sensor_msgs::msg::PointCloud2>::SharedPtr pub_;

    // TF listener
    std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
    std::shared_ptr<tf2_ros::TransformListener> tf_listener_;

    void pointCloudCallback(const sensor_msgs::msg::PointCloud2::SharedPtr msg);
};

#endif // CROP_BOX_FILTER_NODE_HPP
