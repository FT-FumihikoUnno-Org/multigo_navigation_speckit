cmake_minimum_required(VERSION 3.5)
project(nav_control)

# Find required packages
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)


set(THIS_PACKAGE_INCLUDE_DEPENDS
    geometry_msgs
    sensor_msgs
)

include_directories(
  include 
  ${OpenCV_INCLUDE_DIRS} 
)

# Add the executable
add_executable(nav_control_node src/nav_control.cpp)

# Link libraries and dependencies
ament_target_dependencies(nav_control_node
  rclcpp
  sensor_msgs
  geometry_msgs
)

# Link OpenCV libraries
target_link_libraries(nav_control_node
  ${OpenCV_LIBS}  # Added OpenCV libraries
  ${tf2_LIBRARIES}
  ${tf2_ros_LIBRARIES}
)

# Install target
install(TARGETS
  nav_control_node
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
