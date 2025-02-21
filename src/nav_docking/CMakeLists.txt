cmake_minimum_required(VERSION 3.5)
project(nav_docking)

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
find_package(tf2 REQUIRED)

find_package(nav_interface REQUIRED)
find_package(rclcpp_action REQUIRED)
find_package(rclcpp_components REQUIRED)


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
    rclcpp_action
    rclcpp_components
    nav_interface

)

include_directories(
  include 
  ${OpenCV_INCLUDE_DIRS} 
)

# Add the executable
add_executable(nav_docking_node src/nav_docking.cpp)

# Link libraries and dependencies
ament_target_dependencies(nav_docking_node
  rclcpp
  sensor_msgs
  geometry_msgs
  tf2
  tf2_ros
  tf2_geometry_msgs
  cv_bridge  # Added cv_bridge dependency

  "nav_interface"
  "rclcpp_action"
  "rclcpp_components"
)

# Link OpenCV libraries
target_link_libraries(nav_docking_node
  ${OpenCV_LIBS}  # Added OpenCV libraries
  ${tf2_LIBRARIES}
  ${tf2_ros_LIBRARIES}
)

# Install target
install(TARGETS
  nav_docking_node
  DESTINATION lib/${PROJECT_NAME})

# Install launch files
install(DIRECTORY launch/
  DESTINATION share/${PROJECT_NAME}/launch
)

# Install config files
# Install config directory into the share folder
install(
  DIRECTORY config/
  DESTINATION share/${PROJECT_NAME}/config
)

# ament package macros
ament_package()
