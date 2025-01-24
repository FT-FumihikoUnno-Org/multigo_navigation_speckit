#include <functional>
#include <future>
#include <memory>
#include <string>
#include <sstream>

#include "nav_interface/action/fibonacci.hpp"
#include "nav_interface/action/dock.hpp"

#include "rclcpp/rclcpp.hpp"
#include "rclcpp_action/rclcpp_action.hpp"
#include "rclcpp_components/register_node_macro.hpp"

class NavMaster : public rclcpp::Node
{
public:
  using Fibonacci = nav_interface::action::Fibonacci;
  using GoalHandleFibonacci = rclcpp_action::ClientGoalHandle<Fibonacci>;

  using Dock = nav_interface::action::Dock;
  using GoalHandleDock = rclcpp_action::ClientGoalHandle<Dock>;

  explicit NavMaster(const rclcpp::NodeOptions & node_options = rclcpp::NodeOptions())
  : Node("nav_master", node_options), goal_done_fibonacci_(false), goal_done_dock_(false)
  {
    this->fibonacci_client_ = rclcpp_action::create_client<Fibonacci>(
      this,
      "fibonacci_action");

    this->dock_client_ = rclcpp_action::create_client<Dock>(
      this,
      "dock");

    // Declare and get parameters
    this->declare_parameter<int>("order", 5); // Default for Fibonacci
    this->get_parameter("order", order_);

    RCLCPP_INFO(this->get_logger(), "Nav Master node has been started");

    this->timer_ = this->create_wall_timer(
      std::chrono::milliseconds(500),
      std::bind(&NavMaster::send_fibonacci_goal, this));

    this->dock_timer_ = this->create_wall_timer(
      std::chrono::seconds(10),
      std::bind(&NavMaster::send_dock_goal, this));
  }

  bool are_goals_done() const
  {
    return this->goal_done_fibonacci_ && this->goal_done_dock_;
  }

  void send_fibonacci_goal()
  {
    using namespace std::placeholders;

    this->timer_->cancel();
    this->goal_done_fibonacci_ = false;

    if (!this->fibonacci_client_) {
      RCLCPP_ERROR(this->get_logger(), "Fibonacci action client not initialized");
      return;
    }

    if (!this->fibonacci_client_->wait_for_action_server(std::chrono::seconds(10))) {
      RCLCPP_ERROR(this->get_logger(), "Fibonacci action server not available");
      this->goal_done_fibonacci_ = true;
      return;
    }

    auto goal_msg = Fibonacci::Goal();
    goal_msg.order = order_;

    RCLCPP_INFO(this->get_logger(), "Sending Dummy Fibonacci goal: %d", order_);

    auto send_goal_options = rclcpp_action::Client<Fibonacci>::SendGoalOptions();
    send_goal_options.goal_response_callback =
      std::bind(&NavMaster::fibonacci_goal_response_callback, this, _1);
    send_goal_options.feedback_callback =
      std::bind(&NavMaster::fibonacci_feedback_callback, this, _1, _2);
    send_goal_options.result_callback =
      std::bind(&NavMaster::fibonacci_result_callback, this, _1);

    this->fibonacci_client_->async_send_goal(goal_msg, send_goal_options);
  }

  void send_dock_goal()
  {
    using namespace std::placeholders;

    this->dock_timer_->cancel();
    this->goal_done_dock_ = false;

    if (!this->dock_client_) {
      RCLCPP_ERROR(this->get_logger(), "Dock action client not initialized");
      return;
    }

    if (!this->dock_client_->wait_for_action_server(std::chrono::seconds(10))) {
      RCLCPP_ERROR(this->get_logger(), "Dock action server not available");
      this->goal_done_dock_ = true;
      return;
    }
    else{
      RCLCPP_INFO(this->get_logger(), "Docking node ready.");
    }


    std::string user_input;
    RCLCPP_INFO(this->get_logger(), "Initiate Docking? (yes/no): ");
    std::cin >> user_input;

    if (user_input != "yes" && user_input != "y") {
        RCLCPP_INFO(this->get_logger(), "Dock goal not sent.");
        return;
    }


    auto goal_msg = Dock::Goal();
    goal_msg.dock_request = true;

    RCLCPP_INFO(this->get_logger(), "Sending Dock goal.");

    auto send_goal_options = rclcpp_action::Client<Dock>::SendGoalOptions();
    send_goal_options.goal_response_callback =
      std::bind(&NavMaster::dock_goal_response_callback, this, _1);
    send_goal_options.feedback_callback =
      std::bind(&NavMaster::dock_feedback_callback, this, _1, _2);
    send_goal_options.result_callback =
      std::bind(&NavMaster::dock_result_callback, this, _1);

    this->dock_client_->async_send_goal(goal_msg, send_goal_options);
  }


private:
  rclcpp_action::Client<Fibonacci>::SharedPtr fibonacci_client_;
  rclcpp_action::Client<Dock>::SharedPtr dock_client_;
  rclcpp::TimerBase::SharedPtr timer_;
  rclcpp::TimerBase::SharedPtr dock_timer_;
  bool goal_done_fibonacci_ = true;
  bool goal_done_dock_ = true;
  int order_;

  void fibonacci_goal_response_callback(const GoalHandleFibonacci::SharedPtr & goal_handle)
  {
    if (!goal_handle) {
      RCLCPP_ERROR(this->get_logger(), "Fibonacci goal was rejected by server");
    } else {
      RCLCPP_INFO(this->get_logger(), "Fibonacci goal accepted by server");
    }
  }

  void fibonacci_feedback_callback(
    GoalHandleFibonacci::SharedPtr,
    const std::shared_ptr<const Fibonacci::Feedback> feedback)
  {
    std::stringstream ss;
    ss << "Fibonacci feedback: ";
    for (auto number : feedback->partial_sequence) {
      ss << number << " ";
    }
    RCLCPP_INFO(this->get_logger(), ss.str().c_str());
  }

  void fibonacci_result_callback(const GoalHandleFibonacci::WrappedResult & result)
  {
    this->goal_done_fibonacci_ = true;
    if (result.code == rclcpp_action::ResultCode::SUCCEEDED) {
      std::stringstream ss;
      ss << "Fibonacci result: ";
      for (auto number : result.result->result_sequence) {
        ss << number << " ";
      }
      RCLCPP_INFO(this->get_logger(), ss.str().c_str());
    } else {
      RCLCPP_ERROR(this->get_logger(), "Fibonacci goal failed");
    }
  }

  void dock_goal_response_callback(const GoalHandleDock::SharedPtr & goal_handle)
  {
    if (!goal_handle) {
      RCLCPP_ERROR(this->get_logger(), "Dock goal was rejected by server");
    } else {
      RCLCPP_INFO(this->get_logger(), "Dock goal accepted by server");
    }
  }

  void dock_feedback_callback(
    GoalHandleDock::SharedPtr,
    const std::shared_ptr<const Dock::Feedback> feedback)
  {
    RCLCPP_INFO_THROTTLE(this->get_logger(), *this->get_clock(), 1000, "Dock feedback: distance = %.2f", feedback->distance);
  }

  void dock_result_callback(const GoalHandleDock::WrappedResult & result)
  {
    this->goal_done_dock_ = true;
    if (result.code == rclcpp_action::ResultCode::SUCCEEDED) {
      RCLCPP_INFO(this->get_logger(), "Docking completed successfully. Success: %d", result.result->success);
    } else {
      RCLCPP_ERROR(this->get_logger(), "Dock goal failed");
    }
  }
};

int main(int argc, char* argv[]){
    rclcpp::init(argc, argv);

    auto node = std::make_shared<NavMaster>();

    while (!node->are_goals_done()) {
    rclcpp::spin_some(node);
  }

    rclcpp::shutdown();
    return 0;
}