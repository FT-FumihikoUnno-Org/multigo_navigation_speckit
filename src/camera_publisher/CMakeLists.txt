cmake_minimum_required(VERSION 3.8)
project(camera_publisher)

# Default to C++17
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(cv_bridge REQUIRED)
find_package(image_transport REQUIRED)
find_package(OpenCV REQUIRED COMPONENTS highgui imgcodecs imgproc videoio)
find_package(pluginlib REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rosidl_default_generators REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(std_msgs REQUIRED)
find_package(ament_index_cpp REQUIRED)
find_package(yaml-cpp REQUIRED)

include_directories(include)

# add the publisher from video example
add_executable(publisher_from_video src/publisher_from_video.cpp)
target_link_libraries(publisher_from_video
  cv_bridge::cv_bridge
  image_transport::image_transport
  opencv_highgui
  opencv_videoio
  rclcpp::rclcpp
  yaml-cpp
  "${sensor_msgs_TARGETS}"
  "${std_msgs_TARGETS}"
)


# Install executables
install(
  TARGETS publisher_from_video
  RUNTIME DESTINATION lib/${PROJECT_NAME}
)

# Install include directories
install(
  DIRECTORY include/
  DESTINATION include/${PROJECT_NAME}
)

# Install config directory into the share folder
install(
  DIRECTORY config/
  DESTINATION share/${PROJECT_NAME}/config
)

ament_export_include_directories(include)
ament_export_dependencies(cv_bridge image_transport pluginlib rosidl_default_runtime rclcpp sensor_msgs std_msgs)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
