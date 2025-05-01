# Multi-Go

## Overview
Multi-Go autonomous robot for wheelchair and cart mobility. 

**Keywords:** ArUco, Navigation stack, docking


## Prerequisites
- [Ubuntu 22.04](https://releases.ubuntu.com/22.04/)
- [ROS2 Humble](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debs.html)
- Gazebo - follow the installation steps mentioned below
- [NAV2](https://emanual.robotis.com/docs/en/platform/turtlebot3/quick-start/) - follow the installation steps mentioned below
- ~~OpenCV with contrib~~


Run:

    echo 'source /opt/ros/humble/setup.bash' >> ~/.bashrc
    sudo apt update
~~sudo apt upgrade~~

Reload or open a new terminal.

### Installing Gazebo
    sudo apt install ros-humble-gazebo-*
    sudo apt install ros-humble-gazebo-ros-pkgs
    sudo apt install ros-humble-gazebo-ros

### Installing NAV2
    sudo apt install ros-humble-cartographer
    sudo apt install ros-humble-cartographer-ros
    sudo apt install ros-humble-navigation2
    sudo apt install ros-humble-nav2-bringup

#### Install TurtleBot3 Packages
    mkdir -p ~/turtlebot3_ws/src
    cd ~/turtlebot3_ws/src/
    git clone -b humble https://github.com/ROBOTIS-GIT/DynamixelSDK.git
    git clone -b humble https://github.com/ROBOTIS-GIT/turtlebot3_msgs.git
    git clone -b humble https://github.com/ROBOTIS-GIT/turtlebot3.git
    sudo apt install python3-colcon-common-extensions
    cd ~/turtlebot3_ws
    colcon build --symlink-install
    echo 'source ~/turtlebot3_ws/install/setup.bash' >> ~/.bashrc
    source ~/.bashrc

#### Configure Environment for TurtleBot3
    echo 'export ROS_DOMAIN_ID=30 #TURTLEBOT3' >> ~/.bashrc
    echo 'source /usr/share/gazebo/setup.sh' >> ~/.bashrc
    source ~/.bashrc

#### Install TurtleBot3 Simulation Package for Gazebo
    sudo apt-get install ros-humble-turtlebot3-gazebo ##New script required for the correct directory of models and world maps to be installed later.
    cd ~/turtlebot3_ws/src/
    git clone -b humble https://github.com/ROBOTIS-GIT/turtlebot3_simulations.git
    cd ~/turtlebot3_ws && colcon build --symlink-install

### Optional - Testing NAV2 and Gazebo Installation 
    export TURTLEBOT3_MODEL=waffle
    ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py
    ros2 run turtlebot3_gazebo turtlebot3_drive
    ros2 launch turtlebot3_bringup rviz2.launch.py

If all of the prerequisites have been installed properly, Gazebo and RVIZ would open and the turtlebot would drive autonomously in both.



## Installation of MultiGo
Open a new terminal window and run these commands:

	sudo apt update
	sudo apt install ros-humble-pcl-msgs python3-pip
 	~~sudo apt install ros-humble-pcl-conversions~~
	sudo apt install ros-humble-stereo-msgs ros-humble-ament-lint-auto ros-humble-image-geometry
	pip3 install pyyaml
 	pip install pyserial
	sudo apt install python3-serial
	sudo apt install ros-$ROS_DISTRO-rtabmap-ros
 	~~sudo apt-get install ros-humble-pcl-ros~~
 	sudo apt install ros-humble-rtabmap-slam
 	sudo apt install ros-humble-pointcloud-to-laserscan
  	sudo apt install ros-humble-laser-filters
	sudo apt update

### Cloning Packages
Open a new terminal window and run these commands:

    git config --global submodule.recurse true
    git clone --recurse-submodules -b feature/localization https://github.com/Futu-reADS/multigo_navigation.git
    cd multigo_navigation
    vcs import src < multigo.repos --recursive
    vcs pull src


### Install
    
    cd multigo_navigation
    rosdep update
    rosdep install --from-paths src --ignore-src -r -y
    colcon build --symlink-install


Close all terminals and reopen them for the following:

## Run	
  Run following commands:
  
    cd multigo_navigation
    source install/setup.bash 

Simulation:

    ros2 launch boot simulation.launch.py 
    
    ros2 launch boot run.launch.py 

Robot: 

    ros2 launch boot boot.launch.py 
    
    ros2 launch boot run.launch.py 

## Remote Login Example
    ssh -X USER @ IP_Address
    source install/setup.bash
    ros2 launch boot rviz_launch.py
