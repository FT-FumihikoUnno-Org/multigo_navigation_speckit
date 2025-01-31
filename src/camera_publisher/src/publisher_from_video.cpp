#include <sstream>
#include "cv_bridge/cv_bridge.h"
#include "image_transport/image_transport.hpp"
#include "opencv2/core/mat.hpp"
#include "opencv2/imgproc.hpp"
#include "opencv2/videoio.hpp"
#include "rclcpp/rclcpp.hpp"
#include "sensor_msgs/msg/camera_info.hpp"
#include <yaml-cpp/yaml.h>
#include <ament_index_cpp/get_package_share_directory.hpp>
#include <iostream>

std::shared_ptr<sensor_msgs::msg::CameraInfo> load_yaml_file(std::string calib_file_path)
{
  std::shared_ptr<sensor_msgs::msg::CameraInfo> camera_info_msg = std::make_shared<sensor_msgs::msg::CameraInfo>();

  try
  {
    // Load the YAML file
    YAML::Node config = YAML::LoadFile(calib_file_path);
    std::string frame_id = config["frame_id"].as<std::string>();
    int image_height = config["image_height"].as<int>();
    int image_width = config["image_width"].as<int>();

    std::vector<double> distortion_coefficients(5);  // Resize the vector to hold 5 elements
    for (size_t i = 0; i < distortion_coefficients.size(); ++i) {
        distortion_coefficients[i] = config["distortion_coefficients"]["data"][i].as<double>();
    }

    std::array<double, 9> camera_matrix;
    for (size_t i = 0; i < camera_matrix.size(); ++i) {
        camera_matrix[i] = config["camera_matrix"]["data"][i].as<double>();
    }
    // Set camera info parameters
    camera_info_msg->header.frame_id = frame_id;
    camera_info_msg->height = image_height;
    camera_info_msg->width = image_width;
    camera_info_msg->k = camera_matrix;
    camera_info_msg->d = distortion_coefficients;
    camera_info_msg->distortion_model = "plumb_bob";
    camera_info_msg->p = {1000.0, 0.0, 640.0, 0.0, 0.0, 1000.0, 360.0, 0.0, 0.0, 0.0, 1.0, 0.0};
  }
  catch (const std::exception& e) 
  {
        std::cout << "calib_file_path:\n " << calib_file_path << std::endl;
        std::cerr << "Error loading YAML file: " << e.what() << std::endl;
  }

  return camera_info_msg;

}

int main(int argc, char **argv)
{
  // Initialize ROS 2
  rclcpp::init(argc, argv);
  std::shared_ptr<rclcpp::Node> node = rclcpp::Node::make_shared("image_publisher");
  std::string package_path = ament_index_cpp::get_package_share_directory("camera_publisher");
  std::string calib_file_path = package_path + "/config/calib.yaml";
  // Retrieve parameters
  int camera_index;
  std::string camera_topic;
  std::string camera_info_topic;
  std::string frame_id;
  int desired_fps;
  bool force_desired_fps = false;
  // Declare parameters with default values
  node->declare_parameter<std::string>("camera_calib_file", calib_file_path);
  node->declare_parameter<int>("camera_index", 0);
  node->declare_parameter<std::string>("frame_id", "/default_frame_id");
  node->declare_parameter<std::string>("camera_topic", "/default_camera_topic");
  node->declare_parameter<std::string>("camera_info_topic", "/default_camera_info");
  node->declare_parameter<int>("desired_fps", 5);
  node->declare_parameter<bool>("force_desired_fps", false);

  node->get_parameter("camera_calib_file", calib_file_path);
  node->get_parameter("camera_index", camera_index);
  node->get_parameter("frame_id", frame_id);
  node->get_parameter("camera_topic", camera_topic);
  node->get_parameter("camera_info_topic", camera_info_topic);
  node->get_parameter("desired_fps", desired_fps);
  node->get_parameter("force_desired_fps", force_desired_fps);

  std::shared_ptr<sensor_msgs::msg::CameraInfo> camera_info_msg = load_yaml_file(calib_file_path);
  camera_info_msg->header.frame_id = frame_id; // Set to ID from launch file.
  // Open video capture
  int video_source = camera_index;
  cv::VideoCapture cap(video_source);
  if (!cap.isOpened()) 
  {
    RCLCPP_ERROR(node->get_logger(), "Failed to open video source at index %d.", video_source);
    return 1;
  }
  
  // Set camera resolution to 1280x720 for optimal performance
  cap.set(cv::CAP_PROP_FRAME_WIDTH, camera_info_msg->width);
  cap.set(cv::CAP_PROP_FRAME_HEIGHT, camera_info_msg->height);
  cap.set(cv::CAP_PROP_BUFFERSIZE, 1); 
  // cap.set(cv::CAP_PROP_FOURCC, cv::VideoWriter::fourcc('M', 'J', 'P', 'G'));

  RCLCPP_INFO(node->get_logger(), "Camera Index: %u", video_source);
  RCLCPP_INFO(node->get_logger(), "Requested Camera width: %u", camera_info_msg->width);
  RCLCPP_INFO(node->get_logger(), "Requested Camera height: %u", camera_info_msg->height);
  RCLCPP_INFO(node->get_logger(), "FrameID: %s", camera_info_msg->header.frame_id.c_str());

  // Initialize image transport and publishers
  image_transport::TransportHints transport_hints(node.get(), "compressed");
  image_transport::ImageTransport it(node);
  auto image_pub = it.advertise(camera_topic, 1);
  auto camera_info_pub = node->create_publisher<sensor_msgs::msg::CameraInfo>(camera_info_topic, 1);

  cv::Mat frame, gray_frame;
  std_msgs::msg::Header hdr;
  rclcpp::WallRate loop_rate(desired_fps);
  sensor_msgs::msg::Image::SharedPtr msg;

  while (rclcpp::ok()) 
  {
    cap >> frame;
    if (!frame.empty()) 
    {
      cv::cvtColor(frame, gray_frame, cv::COLOR_BGR2GRAY);
      hdr.stamp = node->get_clock()->now();
      camera_info_msg->header.stamp = hdr.stamp;
      msg = cv_bridge::CvImage(hdr, "mono8", gray_frame).toImageMsg();
      image_pub.publish(msg);
      camera_info_pub->publish(*camera_info_msg);
    }
    else 
    {
      // RCLCPP_WARN(node->get_logger(), "Captured empty frame. Skipping.");
    }
    rclcpp::spin_some(node);
    loop_rate.sleep();
  }

  RCLCPP_INFO(node->get_logger(), "Shutting down image publisher.");
  cap.release();
  rclcpp::shutdown();
  return 0;
}
