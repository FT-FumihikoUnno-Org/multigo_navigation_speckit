#include "laserscan_to_pcl.hpp"

LaserScanToPCLNode::LaserScanToPCLNode() : Node("laserscan_to_pcl_node")
{
  // Declare parameters with default values
  this->declare_parameter("input_topic", "/scan");
  this->declare_parameter("output_topic", "/scan_pointcloud");
  this->declare_parameter("z_height", 0.2);  // Default z height is 0.2 meters

  // Get parameters from the parameter server
  input_topic_ = this->get_parameter("input_topic").as_string();
  output_topic_ = this->get_parameter("output_topic").as_string();
  z_height_ = this->get_parameter("z_height").as_double();  // Retrieve z height parameter

  // Subscription and publication
  auto qos = rclcpp::SensorDataQoS();
  scan_sub_ = this->create_subscription<sensor_msgs::msg::LaserScan>(
      input_topic_, qos, std::bind(&LaserScanToPCLNode::scan_callback, this, std::placeholders::_1));

  cloud_pub_ = this->create_publisher<sensor_msgs::msg::PointCloud2>(output_topic_, 10);
}

void LaserScanToPCLNode::scan_callback(sensor_msgs::msg::LaserScan::SharedPtr scan)
{
  pcl::PointCloud<pcl::PointXYZI>::Ptr cloud(new pcl::PointCloud<pcl::PointXYZI>);

  float angle = scan->angle_min;
  for (const auto &range : scan->ranges)
  {
    if (std::isfinite(range))
    {
      pcl::PointXYZI pt;
      pt.x = range * std::cos(angle);
      pt.y = range * std::sin(angle);
      pt.z = z_height_;
      pt.intensity = 1.0f;  // Default intensity value.
      cloud->points.push_back(pt);
    }
    angle += scan->angle_increment;
  }

  cloud->width = cloud->points.size();
  cloud->height = 1;
  cloud->is_dense = true;

  // Convert pcl PointCloud to ROS PointCloud2 message
  sensor_msgs::msg::PointCloud2 ros_cloud;
  pcl::toROSMsg(*cloud, ros_cloud);

  // Keep the original frame and timestamp from the LaserScan message
  ros_cloud.header.frame_id = scan->header.frame_id;
  ros_cloud.header.stamp = scan->header.stamp;

  // Publish the PointCloud2 message
  cloud_pub_->publish(ros_cloud);
}

// Main function to initialize and spin the node
int main(int argc, char **argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<LaserScanToPCLNode>());
  rclcpp::shutdown();
  return 0;
}
