#include "crop_box_filter_node.hpp"

CropBoxFilterNode::CropBoxFilterNode() : Node("crop_box_filter_node")
{
    // Declare parameters
    this->declare_parameter("inner_min_x", -0.0);
    this->declare_parameter("inner_max_x", 0.0);
    this->declare_parameter("inner_min_y", -0.0);
    this->declare_parameter("inner_max_y", 0.0);
    this->declare_parameter("inner_min_z", -0.0);
    this->declare_parameter("inner_max_z", 0.0);

    this->declare_parameter("outer_min_x", -50.0);
    this->declare_parameter("outer_max_x", 50.0);
    this->declare_parameter("outer_min_y", 50.0);
    this->declare_parameter("outer_max_y", 50.0);
    this->declare_parameter("outer_min_z", 0.0);
    this->declare_parameter("outer_max_z", 5.5);

    this->declare_parameter("keep_organized", false);
    this->declare_parameter("negative", true);
    this->declare_parameter("output_frame", "base_link");
    this->declare_parameter("input_topic", "input");
    this->declare_parameter("output_topic", "output");

    // Get parameters
    inner_min_x_ = this->get_parameter("inner_min_x").get_value<float>();
    inner_max_x_ = this->get_parameter("inner_max_x").get_value<float>();
    inner_min_y_ = this->get_parameter("inner_min_y").get_value<float>();
    inner_max_y_ = this->get_parameter("inner_max_y").get_value<float>();
    inner_min_z_ = this->get_parameter("inner_min_z").get_value<float>();
    inner_max_z_ = this->get_parameter("inner_max_z").get_value<float>();

    outer_min_x_ = this->get_parameter("outer_min_x").get_value<float>();
    outer_max_x_ = this->get_parameter("outer_max_x").get_value<float>();
    outer_min_y_ = this->get_parameter("outer_min_y").get_value<float>();
    outer_max_y_ = this->get_parameter("outer_max_y").get_value<float>();
    outer_min_z_ = this->get_parameter("outer_min_z").get_value<float>();
    outer_max_z_ = this->get_parameter("outer_max_z").get_value<float>();

    keep_organized_ = this->get_parameter("keep_organized").get_value<bool>();
    negative_ = this->get_parameter("negative").get_value<bool>();
    output_frame_ = this->get_parameter("output_frame").get_value<std::string>();
    input_topic = this->get_parameter("input_topic").get_value<std::string>();
    output_topic = this->get_parameter("output_topic").get_value<std::string>();

    // Setup subscriber to point cloud topic
    sub_ = this->create_subscription<sensor_msgs::msg::PointCloud2>(
        input_topic, 10, std::bind(&CropBoxFilterNode::pointCloudCallback, this, std::placeholders::_1));

    // Setup publisher to output transformed and filtered point cloud
    pub_ = this->create_publisher<sensor_msgs::msg::PointCloud2>(output_topic, 10);

    // Create a TF listener
    tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
    tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);
}

void CropBoxFilterNode::pointCloudCallback(const sensor_msgs::msg::PointCloud2::SharedPtr msg)
{
    // Get the input frame from the PointCloud2 message
    std::string input_frame = msg->header.frame_id;

    // Get the transform from input frame to output frame
    geometry_msgs::msg::TransformStamped transform;
    try {
        transform = tf_buffer_->lookupTransform(output_frame_, input_frame, rclcpp::Time(0));
    } catch (tf2::TransformException &ex) {
        RCLCPP_WARN(this->get_logger(), "Could not transform point cloud: %s", ex.what());
        return;
    }

    // Transform the point cloud to the target frame
    sensor_msgs::msg::PointCloud2 transformed_pc;
    try {
        pcl_ros::transformPointCloud(output_frame_, transform, *msg, transformed_pc);
    } catch (const std::exception &e) {
        RCLCPP_ERROR(this->get_logger(), "Error transforming point cloud: %s", e.what());
        return;
    }

    // Create CropBox filter for pcl::PointXYZI (includes intensity)

    pcl::PointCloud<pcl::PointXYZI>::Ptr cloud(new pcl::PointCloud<pcl::PointXYZI>);
    pcl::fromROSMsg(transformed_pc, *cloud);
    pcl::PointCloud<pcl::PointXYZI>::Ptr ego_filtered_cloud(new pcl::PointCloud<pcl::PointXYZI>);
    pcl::PointCloud<pcl::PointXYZI>::Ptr outer_filtered_cloud(new pcl::PointCloud<pcl::PointXYZI>);

    pcl::CropBox<pcl::PointXYZI> crop_box_filter;
    pcl::CropBox<pcl::PointXYZI> crop_outer_filter;
    crop_box_filter.setMin(Eigen::Vector4f(inner_min_x_, inner_min_y_, inner_min_z_, 1.0));
    crop_box_filter.setMax(Eigen::Vector4f(inner_max_x_, inner_max_y_, inner_max_z_, 1.0));
    crop_box_filter.setNegative(negative_);
    crop_box_filter.setKeepOrganized(keep_organized_);

    crop_box_filter.setInputCloud(cloud);
    crop_box_filter.filter(*ego_filtered_cloud);

    crop_outer_filter.setMin(Eigen::Vector4f(outer_min_x_, outer_min_y_, outer_min_z_, 1.0));
    crop_outer_filter.setMax(Eigen::Vector4f(outer_max_x_, outer_max_y_, outer_max_z_, 1.0));
    crop_outer_filter.setNegative(false);
    crop_outer_filter.setKeepOrganized(keep_organized_);

    crop_outer_filter.setInputCloud(ego_filtered_cloud);
    crop_outer_filter.filter(*outer_filtered_cloud);

    // Convert filtered cloud to PointCloud2 message
    sensor_msgs::msg::PointCloud2 filtered_pc_msg;
    pcl::toROSMsg(*outer_filtered_cloud, filtered_pc_msg);

    // Publish filtered point cloud
    pub_->publish(filtered_pc_msg);
}

int main(int argc, char **argv)
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<CropBoxFilterNode>());
    rclcpp::shutdown();
    return 0;
}
