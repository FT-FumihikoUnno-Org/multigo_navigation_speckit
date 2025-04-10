#include "pcl_merge.hpp"

PCLMergeNode::PCLMergeNode() : Node("pcl_merge_node")
{
    // Declare parameters
    // this->declare_parameter("use_sim_time", true);
    
    this->declare_parameter("keep_organized", false);
    this->declare_parameter("negative", true);
    this->declare_parameter("output_frame", "base_link");
    this->declare_parameter("output_topic", "pcl_merged");
    this->declare_parameter("input_topics", std::vector<std::string>({"scan_pointcloud", "/camera_depth_top/camera_depth/points"}));

    // Get parameters
    // auto use_sim_time = this->set_parameter(rclcpp::Parameter("use_sim_time", true));
    keep_organized_ = this->get_parameter("keep_organized").as_bool();
    negative_ = this->get_parameter("negative").as_bool();
    output_frame_ = this->get_parameter("output_frame").as_string();
    output_topic = this->get_parameter("output_topic").as_string();
    input_topics_ = this->get_parameter("input_topics").as_string_array();

    // Resize cloud storage for dynamic number of inputs
    clouds_.resize(input_topics_.size(), nullptr);

    // Subscribe to multiple topics dynamically
    for (size_t i = 0; i < input_topics_.size(); i++) {
        auto callback = [this, i](const sensor_msgs::msg::PointCloud2::SharedPtr msg) { cloud_callback(i, msg); };
        subscribers_.push_back(this->create_subscription<sensor_msgs::msg::PointCloud2>(input_topics_[i], 10, callback));
    }

    // Setup publisher
    pub_ = this->create_publisher<sensor_msgs::msg::PointCloud2>(output_topic, 10);

    // Create a TF listener
    tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
    tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);

    // Timer to periodically merge and publish clouds (approx. 30Hz)
    timer_ = this->create_wall_timer(std::chrono::milliseconds(33), std::bind(&PCLMergeNode::timer_callback, this));
}

void PCLMergeNode::cloud_callback(size_t index, const sensor_msgs::msg::PointCloud2::SharedPtr msg) {
    if (index >= clouds_.size())
        return;

    // Get transform from input frame to output frame
    geometry_msgs::msg::TransformStamped transform;
    try {
        transform = tf_buffer_->lookupTransform(output_frame_, msg->header.frame_id, rclcpp::Time(0));



    } catch (tf2::TransformException &ex) {
        RCLCPP_WARN(this->get_logger(), "Could not transform point cloud [%zu]: %s", index, ex.what());
        return;
    }

    // convert the input sensor_msgs to a pcl::PointCloud<pcl::PointXYZI>.
    pcl::PointCloud<pcl::PointXYZI>::Ptr pcl_cloud(new pcl::PointCloud<pcl::PointXYZI>);
    bool conversion_success = false;

    // First, try to convert directly (works if the message already contains an intensity field)
    try {
        pcl::fromROSMsg(*msg, *pcl_cloud);
        conversion_success = true;
    } catch (std::exception &e) {
        // If the conversion fails, it might be because the cloud contains RGB fields.
        RCLCPP_DEBUG(this->get_logger(), "Direct conversion to PointXYZI failed, trying PointXYZRGB: %s", e.what());
    }

    if (!conversion_success) {
        // Try converting as PointXYZRGB then convert to PointXYZI
        pcl::PointCloud<pcl::PointXYZRGB>::Ptr rgb_cloud(new pcl::PointCloud<pcl::PointXYZRGB>);
        try {
            pcl::fromROSMsg(*msg, *rgb_cloud);
            pcl_cloud->points.resize(rgb_cloud->points.size());
            for (size_t i = 0; i < rgb_cloud->points.size(); ++i) {
                const auto &pt = rgb_cloud->points[i];
                pcl::PointXYZI pt_i;
                pt_i.x = pt.x;
                pt_i.y = pt.y;
                pt_i.z = pt.z;
                // Convert RGB to intensity using luminosity formula:
                // intensity = 0.299*R + 0.587*G + 0.114*B
                uint32_t rgb = *reinterpret_cast<const int*>(&pt.rgb);
                uint8_t r = (rgb >> 16) & 0x0000ff;
                uint8_t g = (rgb >> 8)  & 0x0000ff;
                uint8_t b = (rgb)       & 0x0000ff;
                pt_i.intensity = 0.299 * r + 0.587 * g + 0.114 * b;
                pcl_cloud->points[i] = pt_i;
            }
            conversion_success = true;
        } catch (std::exception &e2) {
            RCLCPP_WARN(this->get_logger(), "Conversion from PointXYZRGB failed: %s", e2.what());
            return;
        }
    }

    // Now transform the point cloud to the output frame
    pcl::PointCloud<pcl::PointXYZI>::Ptr pcl_cloud_transformed(new pcl::PointCloud<pcl::PointXYZI>);
    try {
        pcl_ros::transformPointCloud(*pcl_cloud, *pcl_cloud_transformed, transform);
    } catch (std::exception &ex) {
        RCLCPP_WARN(this->get_logger(), "Error during transform: %s", ex.what());
        return;
    }

    // Store transformed cloud
    clouds_[index] = pcl_cloud_transformed;
}


void PCLMergeNode::timer_callback() {
    // Check if at least one cloud is valid
    bool any_valid = false;
    for (const auto &cloud : clouds_) {
        if (cloud != nullptr) {
            any_valid = true;
            break;
        }
    }
    if (!any_valid) {
        return;  // No valid clouds received yet
    }

    // Create a merged point cloud (PointXYZI)
    pcl::PointCloud<pcl::PointXYZI>::Ptr merged_cloud(new pcl::PointCloud<pcl::PointXYZI>);
    for (const auto& cloud : clouds_) {
        if (cloud) {
            *merged_cloud += *cloud;
        }
    }

    // Downsample the merged cloud using VoxelGrid
    pcl::VoxelGrid<pcl::PointXYZI> voxel_filter;
    voxel_filter.setInputCloud(merged_cloud);
    // Adjust the leaf size based on desired resolution (in meters)
    voxel_filter.setLeafSize(0.05f, 0.05f, 0.05f);
    pcl::PointCloud<pcl::PointXYZI>::Ptr downsampled_cloud(new pcl::PointCloud<pcl::PointXYZI>);
    voxel_filter.filter(*downsampled_cloud);

    // Convert the downsampled cloud back to ROS message
    sensor_msgs::msg::PointCloud2 output_msg;
    pcl::toROSMsg(*downsampled_cloud, output_msg);
    output_msg.header.frame_id = output_frame_;
    // output_msg.header.stamp = this->now();

    pub_->publish(output_msg);
    RCLCPP_INFO_ONCE(this->get_logger(), "Publishing downsampled merged PointXYZI cloud at approx. 30Hz.");
}


int main(int argc, char **argv)
{
    rclcpp::init(argc, argv);
    auto node = std::make_shared<PCLMergeNode>();
    rclcpp::spin(node);
    rclcpp::shutdown();
    return 0;
}
