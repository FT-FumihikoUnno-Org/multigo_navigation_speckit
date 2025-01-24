#include <functional>
#include <memory>
#include <thread>

#include "nav_interface/action/fibonacci.hpp"

#include "rclcpp/rclcpp.hpp"
#include "rclcpp_action/rclcpp_action.hpp"
#include "rclcpp_components/register_node_macro.hpp"


class TestServer : public rclcpp::Node
{
public:
  using Fibonacci = nav_interface::action::Fibonacci;
  using GoalHandleFibonacci = rclcpp_action::ServerGoalHandle<Fibonacci>;

  explicit TestServer(const rclcpp::NodeOptions & options = rclcpp::NodeOptions())
  : Node("test_server", options)
  {
    using namespace std::placeholders;

    RCLCPP_INFO(this->get_logger(), "Test server node has been started");

    this->action_server_ = rclcpp_action::create_server<Fibonacci>(
      this,
      "fibonacci_action",
      std::bind(&TestServer::handle_goal, this, _1, _2),
      std::bind(&TestServer::handle_cancel, this, _1),
      std::bind(&TestServer::handle_accepted, this, _1));

  }

private:
  rclcpp_action::Server<Fibonacci>::SharedPtr action_server_;

  rclcpp_action::GoalResponse handle_goal(
    const rclcpp_action::GoalUUID & uuid,
    std::shared_ptr<const Fibonacci::Goal> goal)
  {
    RCLCPP_INFO(this->get_logger(), "Received goal request with order %ld", goal->order);
    (void)uuid;
    return rclcpp_action::GoalResponse::ACCEPT_AND_EXECUTE;
  }

  rclcpp_action::CancelResponse handle_cancel(
    const std::shared_ptr<GoalHandleFibonacci> goal_handle)
  {
    RCLCPP_INFO(this->get_logger(), "Received request to cancel goal");
    (void)goal_handle;
    return rclcpp_action::CancelResponse::ACCEPT;
  }

  void handle_accepted(const std::shared_ptr<GoalHandleFibonacci> goal_handle)
  {
    using namespace std::placeholders;
    // this needs to return quickly to avoid blocking the executor, so spin up a new thread
    std::thread{std::bind(&TestServer::execute, this, _1), goal_handle}.detach();
  }

  void execute(const std::shared_ptr<GoalHandleFibonacci> goal_handle)
  {
    RCLCPP_INFO(this->get_logger(), "Executing goal");
    rclcpp::Rate loop_rate(1);
    const auto goal = goal_handle->get_goal();
    auto feedback = std::make_shared<Fibonacci::Feedback>();
    auto & sequence = feedback->partial_sequence;
    sequence.push_back(0);
    sequence.push_back(1);
    auto result = std::make_shared<Fibonacci::Result>();

    for (int i = 1; (i < goal->order) && rclcpp::ok(); ++i) {
      
      // Check if there is a cancel request
      if (goal_handle->is_canceling()) {
        result->result_sequence = sequence;
        goal_handle->canceled(result);
        RCLCPP_INFO(this->get_logger(), "Goal canceled");
        return;
      }
      // Update sequence
      sequence.push_back(sequence[i] + sequence[i - 1]);
      
      // Publish feedback

      std::stringstream ss;
      ss << "Publish feedback: ";
      for (size_t i = 0; i < sequence.size(); ++i) {
          ss << sequence[i];
          if (i < sequence.size() - 1) {
            ss << ", ";
          }}

      goal_handle->publish_feedback(feedback);
      RCLCPP_INFO(this->get_logger(), ss.str().c_str());  


      loop_rate.sleep();
    }

    // Check if goal is done
    if (rclcpp::ok()) {
      result->result_sequence = sequence;
      goal_handle->succeed(result);
      RCLCPP_INFO(this->get_logger(), "Goal succeeded");
    }
  }
};  // class TestServer


int main(int argc, char* argv[]){
    rclcpp::init(argc, argv);

    auto node = std::make_shared<TestServer>();

    rclcpp::spin(node);
    rclcpp::shutdown();
    return 0;
}