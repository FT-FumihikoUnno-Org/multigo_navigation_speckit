#ifndef PCL_MERGE_NODE_HPP
#define PCL_MERGE_NODE_HPP

#include <memory>
#include <string>
#include <vector>
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
#include <pcl/filters/voxel_grid.h>
#include <pcl/point_cloud.h>
#include <pcl/PCLPointCloud2.h>
#include <pcl/point_types_conversion.h>
#include <pcl/conversions.h>

class PCLMergeNode : public rclcpp::Node
{
public:
    PCLMergeNode();

private:
    // Parameters
    bool keep_organized_, negative_, use_sim_time;
    std::string output_frame_, output_topic;
    std::vector<std::string> input_topics_;

    // Subscribers
    std::vector<rclcpp::Subscription<sensor_msgs::msg::PointCloud2>::SharedPtr> subscribers_;

    // Point cloud storage (using PointXYZI)
    std::vector<pcl::PointCloud<pcl::PointXYZI>::Ptr> clouds_;

    // Timer
    rclcpp::TimerBase::SharedPtr timer_;

    // Publisher
    rclcpp::Publisher<sensor_msgs::msg::PointCloud2>::SharedPtr pub_;

    // TF listener
    std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
    std::shared_ptr<tf2_ros::TransformListener> tf_listener_;

    // Callbacks
    void cloud_callback(size_t index, const sensor_msgs::msg::PointCloud2::SharedPtr msg);
    void timer_callback();
};

#endif // PCL_MERGE_NODE_HPP
