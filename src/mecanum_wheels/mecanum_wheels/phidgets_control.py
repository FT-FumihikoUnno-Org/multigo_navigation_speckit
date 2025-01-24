#!/usr/bin/python3
# 2024-03-01 S.Tsuchiya
# based on closed_loop_speed_controller.py of the Half Lifter

import rclpy
from rclpy.node import Node
from Phidget22.Phidget import *
from Phidget22.Devices.BLDCMotor import *
from geometry_msgs.msg import Twist, Vector3
from std_srvs.srv import Empty
# from std_srvs.srv import EmptyResponse
import time
import numpy as np

lf_motor = BLDCMotor()
rf_motor = BLDCMotor()
lr_motor = BLDCMotor()
rr_motor = BLDCMotor()

WHEEL_SEPARATION_WIDTH = 0.40
WHEEL_SEPARATION_LENGTH = 0.30
WHEEL_GEOMETRY = (WHEEL_SEPARATION_WIDTH + WHEEL_SEPARATION_LENGTH) / 2
WHEEL_RADIUS = 0.0762
# Unit conversion from rad/s to duty ratio (1.0 duty = 320rpm)
CONSTANT = 33.5    # =320rpm/60s*2pi

# ENABLE Comunicate the Phidgets Hub
ON_LINE_HUB = False
# ON_LINE_HUB = False     # for debug

# ENABLE OR DISABLE CLOSED LOOP CONTROL
# CLOSED_LOOP = True
CLOSED_LOOP = False

# ENABLE OR DISABLE REAL SPEED PUBLISH
REAL_SPEED_PUBLISH = True
# REAL_SPEED_PUBLISH = False

# PID RELATED FLAG
ENABLE_I = True
ENABLE_D = False

# DRIVE MODE
STAND_ALONE = 0
COMBINE_CHAIR = 1

ERROR_SUM_NORM_MAX = 0.5

TimerPeriod = 1.0 / 30.0  # seconds (for 30 Hz)

def connect_motor(motor, name):
    status = False
    while not status:
        status = True
        try:
            motor.openWaitForAttachment(5000)
        except:
            status = False
            rclpy.logging.get_logger("Motor Connection").warn(f"Failed to connect {name} Motor. Trying again...")
            time.sleep(1)

def init_motor(motor):
    motor.setTargetVelocity(0)
    motor.setAcceleration(1.5)
    motor.setDataInterval(100)
    motor.setDataRate(10)

class ControlLoopRealVelocityComputation:
    def __init__(self):
        self.r_vel = np.array([0.0, 0.0, 0.0, 0.0])
        self.r_pos = np.array([0.0, 0.0, 0.0, 0.0])

    def update_wheels_vel(self, r_front_left_pos, r_front_right_pos, r_back_left_pos, r_back_right_pos, dt):
        if dt == 0:
            return self.r_vel  # Avoid division by zero
        new_r_pos = np.array([r_front_left_pos, r_front_right_pos, r_back_left_pos, r_back_right_pos])
        # We compute the difference between the poses.

        delta_pos = np.array([0.0, 0.0, 0.0, 0.0])
        delta_pos[0] = new_r_pos[0] - self.r_pos[0]
        delta_pos[1] = self.r_pos[1] - new_r_pos[1]
        delta_pos[2] = new_r_pos[2] - self.r_pos[2]
        delta_pos[3] = self.r_pos[3] - new_r_pos[3]

        self.r_vel = delta_pos / dt
        self.r_pos = new_r_pos
        return self.r_vel * 2 * 2 * 3.14 / 360 / CONSTANT

class ControlLoopPid:

    def __init__(self):
        self.error = np.array([0.0, 0.0, 0.0, 0.0])
        self.error_sum = np.array([0.0, 0.0, 0.0, 0.0])
        self.last_real_wheel_vel = np.array([0.0, 0.0, 0.0, 0.0])

        self.kp = 0.2
        self.ki = 2.4
        self.kd = 0.0
        pass

    def compute_pid(self, real_wheel_vel, cmd_wheel_vel, dt):
        # Compute current error.
        self.error = np.array([cmd_wheel_vel[0] - real_wheel_vel[0], cmd_wheel_vel[1] - real_wheel_vel[1],
                               cmd_wheel_vel[2] - real_wheel_vel[2], cmd_wheel_vel[3] - real_wheel_vel[3]])

        # Compute accumulated error.
        self.error_sum += self.error * dt

        # Compute differential of wheel speed.
        diff_real_wheel_vel = self.last_real_wheel_vel - real_wheel_vel
        self.last_real_wheel_vel = real_wheel_vel

        # Saturate error_sum
        norm = np.linalg.norm(self.error_sum)
        if ERROR_SUM_NORM_MAX < norm:
            self.error_sum = self.error_sum * ERROR_SUM_NORM_MAX / norm

        if ENABLE_D:
            return self.error * self.kp + self.error_sum * self.ki + diff_real_wheel_vel * self.kd

        elif ENABLE_I:
            # print("error_sum:%s" % self.error_sum)
            return self.error * self.kp + self.error_sum * self.ki

        else:
            return self.error * self.kp


class ControlLoopUtils:
    """
        ControlLoopUtils : **class** contains the tools to work with the velocity msg.
    """

    def __init__(self):
        pass

    @staticmethod
    def compute_inverse_kinematic(linear_velocity, angular_velocity):
        front_left = ((linear_velocity.x - linear_velocity.y - angular_velocity.z * 
                       WHEEL_GEOMETRY) / WHEEL_RADIUS) / CONSTANT
        front_right = ((linear_velocity.x + linear_velocity.y + angular_velocity.z * 
                        WHEEL_GEOMETRY) / WHEEL_RADIUS) / CONSTANT
        back_left = ((linear_velocity.x + linear_velocity.y - angular_velocity.z * 
                      WHEEL_GEOMETRY) / WHEEL_RADIUS) / CONSTANT
        back_right = ((linear_velocity.x - linear_velocity.y + angular_velocity.z * 
                       WHEEL_GEOMETRY) / WHEEL_RADIUS) / CONSTANT
        
        return np.array([front_left, front_right, back_left, back_right])

    @staticmethod
    def compute_forward_kinematic(front_left, front_right, back_left, back_right):
        linear_vel_x = (front_left + front_right + back_left + back_right) * (WHEEL_RADIUS * CONSTANT / 4)
        linear_vel_y = (-front_left + front_right + back_left - back_right) * (WHEEL_RADIUS * CONSTANT / 4)
        angular_vel_z = (-front_left + front_right - back_left + back_right) * (
                (WHEEL_RADIUS * CONSTANT) / (4 * WHEEL_GEOMETRY))

        return {'linear_vel_x': linear_vel_x, 'linear_vel_y': linear_vel_y, 'angular_vel_z': angular_vel_z}

    @staticmethod
    def generate_real_vel_msg(linear_vel_x, linear_vel_y, angular_vel_z):
        linear_vel_msg = Vector3()
        linear_vel_msg.x, linear_vel_msg.y, linear_vel_msg.z = linear_vel_x, linear_vel_y, 0.0
        angular_vel_msg = Vector3()
        angular_vel_msg.x, angular_vel_msg.y, angular_vel_msg.z = 0.0, 0.0, angular_vel_z
        real_vel_msg = Twist()
        real_vel_msg.linear = linear_vel_msg
        real_vel_msg.angular = angular_vel_msg

        return real_vel_msg

class ControlLoop(Node):
    """
        ControlLoop : **class** constant rate loop.
    """

    def __init__(self):
        super().__init__('phidgets_control')
        self.get_logger().info("Initializing Phidgets Motor Controller...")

        self.subscriber_cmd_vel = self.create_subscription(Twist, '/cmd_vel', self.callback, 10)
        self.linear_velocity = None
        self.angular_velocity = None
        self.dt = 0.0
        self.dt_old = None

        self.publisher_real_vel = self.create_publisher(Twist, '/real_vel', 10)

        self.timer = self.create_timer(TimerPeriod, self.timer_callback)
        # self.i = 0

        try:
            lf_motor.setHubPort(3)
            rf_motor.setHubPort(4)
            lr_motor.setHubPort(1)
            rr_motor.setHubPort(2)
            if ON_LINE_HUB:
                connect_motor(lf_motor, "LF")
                connect_motor(rf_motor, "RF")
                connect_motor(lr_motor, "LR")
                connect_motor(rr_motor, "RR")
            else:
                pass
            init_motor(lf_motor)
            init_motor(rf_motor)
            init_motor(lr_motor)
            init_motor(rr_motor)
            self.get_logger().info("Motors Ready")

        except:
            self.get_logger().error("Motors Not Ready!")

        self.utils = ControlLoopUtils()
        self.pid = ControlLoopPid()
        self.real_vel = ControlLoopRealVelocityComputation()

    def __del__(self):
        print("run __del__")
        if ON_LINE_HUB:
            lf_motor.close()
            rf_motor.close()
            lr_motor.close()
            rr_motor.close()
        else:
            pass
    
    def callback(self, msg):
        self.linear_velocity = msg.linear
        self.angular_velocity = msg.angular
        real_vel_msg = Twist()
        real_vel_msg.linear = self.linear_velocity
        real_vel_msg.angular = self.angular_velocity

    def timer_callback(self):
        # If the cmd velocity is acquired
        if self.linear_velocity is not None and self.angular_velocity is not None:

            # time_of_this_loop = rospy.get_time()
            time_of_this_loop = self.get_clock().now().nanoseconds
            # compute dt at the beginning of the loop.
            if self.dt_old is not None:
                self.dt = (time_of_this_loop - self.dt_old) * 1e-9  # Convert nanoseconds to seconds

            # Compute the inverse kinematics.
            cmd_wheels_vel = self.utils.compute_inverse_kinematic(
                self.linear_velocity, self.angular_velocity)

            # Get the current real velocities of the wheels.
            if not ON_LINE_HUB or self.dt_old is None:
                real_wheels_vel = np.array([0.0, 0.0, 0.0, 0.0])
            else:
                real_wheels_vel = self.real_vel.update_wheels_vel(lf_motor.getPosition(),
                                                                rf_motor.getPosition(),
                                                                lr_motor.getPosition(),
                                                                rr_motor.getPosition(), self.dt)


            if REAL_SPEED_PUBLISH:
                # Compute forward kinematics to get the real cartesian speed
                real_vel = self.utils.compute_forward_kinematic(real_wheels_vel[0],
                                                                real_wheels_vel[1],
                                                                real_wheels_vel[2],
                                                                real_wheels_vel[3])

                # Publish the real cartesian velocity of the lifter
                self.publisher_real_vel.publish(
                    self.utils.generate_real_vel_msg(real_vel['linear_vel_x'], 
                                                    real_vel['linear_vel_y'],
                                                    real_vel['angular_vel_z']))
            else:
                pass

            # Compute the new cmd.
            if CLOSED_LOOP and self.dt_old is not None:
                # Compute the pid corrected cmd.
                # cmd_vel = cmd_wheels_vel + self.loop_pid.compute_pid(real_wheels_vel, cmd_wheels_vel,
                #                                                         self.dt)
                cmd_vel = self.pid.compute_pid(real_wheels_vel, cmd_wheels_vel,
                                                                        self.dt)
            else:
                cmd_vel = cmd_wheels_vel
            # We send the new cmd to the motor controllers.
            if ON_LINE_HUB:
                lf_motor.setTargetVelocity(cmd_vel[0])
                rf_motor.setTargetVelocity(-cmd_vel[1])
                lr_motor.setTargetVelocity(cmd_vel[2])
                rr_motor.setTargetVelocity(-cmd_vel[3])
            else:
                pass

            # print('%f, %f,%f,%f, %f,%f,%f,%f, %f,%f,%f,%f, %f,%f,%f,%f' % (
            # print('%u, %f,%f,%f,%f' % (
            #     time_of_this_loop,
            #     cmd_wheels_vel[0], cmd_wheels_vel[1], cmd_wheels_vel[2], cmd_wheels_vel[3]))
                # control_loop_pid.kp, control_loop_pid.ki, control_loop_pid.kd,
                # cmd_vel[0], cmd_vel[1], cmd_vel[2], cmd_vel[3],
                # real_wheels_vel[0], real_wheels_vel[1], real_wheels_vel[2], real_wheels_vel[3]))
            # print("frequency", 1 / control_loop.dt)

            self.dt_old = time_of_this_loop   # save time for calculation of dt in the next loop

def main(args=None):
    rclpy.init(args=args)
    control_loop = ControlLoop()
    rclpy.spin(control_loop)
    control_loop.destroy_node()
    rclpy.shutdown()
        
if __name__ == '__main__':
    main()