cmake_minimum_required(VERSION 3.5)
project(aruco_detect)

# Find required packages
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(tf2_geometry_msgs REQUIRED)
find_package(OpenCV 4.5 REQUIRED)
find_package(cv_bridge REQUIRED)  # Added cv_bridge
find_package(visualization_msgs REQUIRED)
find_package(image_transport REQUIRED)

set(THIS_PACKAGE_INCLUDE_DEPENDS
    OpenCV 4.5
    cv_bridge
    geometry_msgs
    image_transport
    rclcpp
    rclpy
    tf2
    tf2_ros
    tf2_geometry_msgs
    aruco
    aruco_msgs
    sensor_msgs
    visualization_msgs
)

include_directories(
  include 
  ${OpenCV_INCLUDE_DIRS} 
)

# Add the executable
add_executable(aruco_detect_node src/aruco_detect.cpp)

# Link libraries and dependencies
ament_target_dependencies(aruco_detect_node
  rclcpp
  sensor_msgs
  geometry_msgs
  tf2_ros
  tf2_geometry_msgs
  cv_bridge  # Added cv_bridge dependency
)

# Link OpenCV libraries
target_link_libraries(aruco_detect_node
  ${OpenCV_LIBS}  # Added OpenCV libraries
)

# Install target
install(TARGETS
  aruco_detect_node
  DESTINATION lib/${PROJECT_NAME})

# Install launch files
install(DIRECTORY launch/
  DESTINATION share/${PROJECT_NAME}/launch
)

# ament package macros
ament_package()
