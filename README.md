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
	sudo apt install ros-humble-pcl-conversions ros-humble-pcl-msgs python3-pip
	pip3 install pyyaml
	sudo apt install ros-$ROS_DISTRO-rtabmap-ros
 	sudo apt-get install ros-humble-pcl-ros
 	sudo apt install ros-humble-rtabmap-slam
 	sudo apt install ros-humble-pointcloud-to-laserscan
	sudo apt update


### Cloning Packages
Open a new terminal window and run these commands:

    git clone --recurse-submodules -b feature/wheelchair_docking_dual_cam https://github.com/Futu-reADS/multigo.git
    cd ~/multigo
    vcs import src < multigo.repos --recursive
    vcs pull src


### Install
    
    cd ~/multigo
    rosdep update
    rosdep install --from-paths src --ignore-src -r -y
    colcon build --symlink-install

~~Open model folder and move multigo and wheelchair models to .gazebo/models folder: ~~


~~    cp -r models/multigo models/wheelchair ~/.gazebo/models/~~


~~### Changes to .bashrc file~~
~~Add the correct world and model path when Gazebo launches:~~

~~    echo 'export GAZEBO_MODEL_PATH=$GAZEBO_MODEL_PATH:/opt/ros/humble/share/turtlebot3_gazebo/models' >> ~/.bashrc~~
    
~~Open .bashrc file and comment the line:~~

~~    export ROS_DOMAIN_ID=30 #TURTLEBOT3~~

~~by adding a # in front of it:~~

~~    #export ROS_DOMAIN_ID=30 #TURTLEBOT3~~

Close all terminals and reopen them for the following:

## Run	
  Run following commands:
  
    cd ~/multigo
    source install/setup.bash 

Simulation:

    ros2 launch boot simulation.launch.py 
    
    ros2 launch boot run.launch.py 

Robot: 

    ros2 launch boot boot.launch.py 
    
    ros2 launch boot run.launch.py 
