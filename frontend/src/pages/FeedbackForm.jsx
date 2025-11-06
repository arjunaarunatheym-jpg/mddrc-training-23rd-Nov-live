import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Star, Send } from "lucide-react";

const FeedbackForm = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [feedback, setFeedback] = useState({
    overall_rating: 0,
    content_rating: 0,
    trainer_rating: 0,
    venue_rating: 0,
    suggestions: "",
    comments: ""
  });

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await axiosInstance.get(`/sessions/${sessionId}`);
      setSession(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load session details");
      navigate("/participant");
    }
  };

  const handleRatingClick = (field, value) => {
    setFeedback({ ...feedback, [field]: value });
  };

  const handleSubmit = async () => {
    // Validate all ratings are filled
    if (feedback.overall_rating === 0 || feedback.content_rating === 0 || 
        feedback.trainer_rating === 0 || feedback.venue_rating === 0) {
      toast.error("Please provide all ratings");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/feedback/submit", {
        session_id: sessionId,
        ...feedback
      });
      
      toast.success("Feedback submitted successfully! You can now access your certificate.");
      navigate("/participant");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit feedback");
      setSubmitting(false);
    }
  };

  const RatingStars = ({ label, value, field }) => (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(field, star)}
            className="transition-transform hover:scale-110"
            type="button"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-gray-600">{value > 0 ? `${value}/5` : "Not rated"}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/participant")}
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Training Feedback</h1>
          <p className="text-gray-600">{session?.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Feedback Matters</CardTitle>
            <CardDescription>
              Help us improve our training programs by sharing your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Rating */}
            <RatingStars
              label="Overall Training Experience"
              value={feedback.overall_rating}
              field="overall_rating"
            />

            {/* Content Rating */}
            <RatingStars
              label="Training Content Quality"
              value={feedback.content_rating}
              field="content_rating"
            />

            {/* Trainer Rating */}
            <RatingStars
              label="Trainer Effectiveness"
              value={feedback.trainer_rating}
              field="trainer_rating"
            />

            {/* Venue Rating */}
            <RatingStars
              label="Venue & Facilities"
              value={feedback.venue_rating}
              field="venue_rating"
            />

            {/* Suggestions */}
            <div className="space-y-2">
              <Label htmlFor="suggestions" className="text-base font-medium">
                Suggestions for Improvement
              </Label>
              <Textarea
                id="suggestions"
                value={feedback.suggestions}
                onChange={(e) => setFeedback({ ...feedback, suggestions: e.target.value })}
                placeholder="What could we do better? Any suggestions?"
                rows={4}
                data-testid="suggestions-input"
              />
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments" className="text-base font-medium">
                Additional Comments
              </Label>
              <Textarea
                id="comments"
                value={feedback.comments}
                onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                placeholder="Any other feedback you'd like to share?"
                rows={4}
                data-testid="comments-input"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="submit-feedback-button"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-3">
                After submitting feedback, your certificate will be available for download
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackForm;
