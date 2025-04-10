cmake_minimum_required(VERSION 3.8)
project(pcl_merge)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(pcl_ros REQUIRED)
find_package(pcl_conversions REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(tf2_geometry_msgs REQUIRED)
find_package(std_msgs REQUIRED)
find_package(tf2 REQUIRED)

include_directories(
  include 
)

# Add executable
add_executable(pcl_merge_node src/pcl_merge.cpp)

# Link libraries for ROS 2 and PCL
ament_target_dependencies(pcl_merge_node
  pcl_ros
  pcl_conversions
  rclcpp
  sensor_msgs
  tf2_ros
  tf2_geometry_msgs
  std_msgs
)

# Install the node executable
install(TARGETS
  pcl_merge_node
  DESTINATION lib/${PROJECT_NAME}
)

# Install the header files
install(DIRECTORY include/ DESTINATION include/${PROJECT_NAME})

# Add the required include directories for PCL and pcl_ros
target_include_directories(pcl_merge_node
  PRIVATE
    ${PCL_INCLUDE_DIRS}
    ${pcl_ros_INCLUDE_DIRS}  # Include pcl_ros headers
)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # The following line skips the linter which checks for copyrights
  # Comment the line when a copyright and license are added to all source files
  set(ament_cmake_copyright_FOUND TRUE)
  # The following line skips cpplint (only works in a git repo)
  # Comment the line when
  # a copyright and license are added to all source files
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
