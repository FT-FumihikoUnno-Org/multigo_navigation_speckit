# Multi-Go

## Overview
Multi-Go autonomous robot for wheelchair and cart mobility. 

**Keywords:** ARuco, Navigation stack, docking


## Prerequisites

- ROS2 Humble / Ubuntu 22.04 / NAV2 / Gazebo Simulator with ROS2 packages


## Installation

	sudo apt update
	sudo apt install gazebo ros-humble-gazebo-ros-pkgs ros-humble-gazebo-ros
	sudo apt install ros-humble-gazebo-*
	sudo apt install ros-$ROS_DISTRO-gazebo-ros-pkgs
	sudo apt install ros-humble-pcl-conversions ros-humble-pcl-msgs python3-pip
	pip3 install pyyaml
	sudo apt install ros-$ROS_DISTRO-rtabmap-ros
	sudo apt update

Install NAV2 
	https://emanual.robotis.com/docs/en/platform/turtlebot3/quick-start/



### Cloning

    git clone -b feature/wheelchair_docking https://github.com/ttvines/multigo.git
    
    cd ~/multigo
    rosdep update
    rosdep install --from-paths src --ignore-src -r -y
    colcon build --symlink-install

Open model folder and move multigo and wheelchair models to .gazebo/models folder. 

    cp -r models/multigo models/wheelchair ~/.gazebo/models/
    
## Run	
  Run following commands:
  
    cd ~/multigo
    source install/setup.bash 
    ros2 launch boot multigo_simulation_launch.py 

New tab

    source install/setup.bash 
    ros2 launch aruco_detect aruco_detect.launch.py 


New tab

    source install/setup.bash 
    ros2 launch nav_docking nav_docking.launch.py
