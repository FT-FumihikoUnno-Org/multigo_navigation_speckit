# Multi-Go Master Package

## Overview
The Master Control node and its dependencies for the Multi-Go vehicle. Uses ROS2 actions for communication between nodes. 

## Location 
The overall package will be within the multigo/src/ folder. 

## Installation 
Go to
```
cd ~/multigo/src
git clone https://github.com/Futu-reADS/mg_master.git
cd ~/multigo
colcon build --symlink-install
```

## Run
```
cd ~/multigo
ros2 run master_node master_node
```

Please ensure you have the action server node running to allow the master node send the action request. 
