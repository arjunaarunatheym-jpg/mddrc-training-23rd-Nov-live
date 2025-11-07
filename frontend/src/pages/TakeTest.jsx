import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";

const TakeTest = () => {
  const { testId, sessionId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      const response = await axiosInstance.get(`/tests/${testId}`);
      setTest(response.data);
      setAnswers(new Array(response.data.questions.length).fill(-1));
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load test");
      navigate("/dashboard");
    }
  };

  const handleAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = answers.findIndex(ans => ans === -1);
    if (unanswered !== -1) {
      toast.error(`Please answer question ${unanswered + 1}`);
      return;
    }

    setSubmitting(true);
    try {
      // Extract original question indices if questions were shuffled
      const questionIndices = test.questions.map(q => q.original_index !== undefined ? q.original_index : null);
      const hasIndices = questionIndices.some(idx => idx !== null);
      
      const response = await axiosInstance.post("/tests/submit", {
        test_id: testId,
        session_id: sessionId,
        answers: answers,
        question_indices: hasIndices ? questionIndices : null,
      });
      
      toast.success("Test submitted successfully!");
      navigate(`/test-results/${response.data.id}`);
    } catch (error) {
      toast.error("Failed to submit test");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading test...</p>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">
              {test.test_type === "pre" ? "Pre-Test" : "Post-Test"}
            </h1>
            <p className="text-sm text-gray-600">{test.questions.length} Questions</p>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-blue-900">
              <li>Read each question carefully</li>
              <li>Select one answer for each question</li>
              <li>You must answer all questions before submitting</li>
              <li>Your results will be shown immediately after submission</li>
            </ul>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {test.questions.map((question, qIndex) => (
            <Card key={qIndex} data-testid={`question-card-${qIndex}`}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {qIndex + 1} of {test.questions.length}
                </CardTitle>
                <CardDescription className="text-base font-medium text-gray-900">
                  {question.question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[qIndex]?.toString()}
                  onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
                >
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAnswerChange(qIndex, optIndex)}
                      >
                        <RadioGroupItem
                          value={optIndex.toString()}
                          id={`q${qIndex}-opt${optIndex}`}
                          data-testid={`q${qIndex}-option-${optIndex}`}
                        />
                        <Label
                          htmlFor={`q${qIndex}-opt${optIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <Card className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Ready to submit?</p>
                <p className="text-sm text-gray-600">
                  Answered: {answers.filter(a => a !== -1).length} / {test.questions.length}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
                data-testid="submit-test-button"
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TakeTest;
