import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Plus, MessageCircle, Send, ChevronDown, ChevronUp,
  Shield, Eye, EyeOff, Users, Lightbulb, X, Clock
} from "lucide-react";

interface Problem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

interface Comment {
  id: string;
  problem_id: string;
  user_id: string;
  message: string;
  is_anonymous: boolean;
  author_name: string;
  created_at: string;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const categories = ["General", "Relationships", "Career", "Health", "Family", "Finance", "Loneliness", "Stress"];

export default function PeaceOfMind() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");

  const { data: problems, isLoading } = useQuery<Problem[]>({
    queryKey: ["/api/problems"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/problems", { title, description, category });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      setTitle("");
      setDescription("");
      setCategory("General");
      setShowForm(false);
      toast({ title: "Posted anonymously", description: "Your concern has been shared. The community will help." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not post. Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-5" data-testid="peace-page">
      {/* Header */}
      <div>
        <h1 className="font-bold text-base flex items-center gap-2" data-testid="peace-title">
          <Brain className="w-5 h-5 text-primary" />
          Peace of Mind
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Share your concerns anonymously. Get support and solutions from the community.
        </p>
      </div>

      {/* Privacy banner */}
      <Card className="p-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
            All posts here are <span className="font-semibold">completely anonymous</span>. Your identity is never shown. Feel safe to share and get help.
          </p>
        </div>
      </Card>

      {/* New problem button */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full gap-2"
          data-testid="btn-new-problem"
        >
          <Plus className="w-4 h-4" />
          Share What's On Your Mind
        </Button>
      ) : (
        <Card className="p-4 border border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              Post Anonymously
            </h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            placeholder="What's troubling you? (brief title)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
            data-testid="input-problem-title"
          />
          <Textarea
            placeholder="Describe your situation... The community will offer support and ideas."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            data-testid="input-problem-desc"
          />
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !description.trim() || createMutation.isPending}
            className="w-full gap-2"
            data-testid="btn-submit-problem"
          >
            <Shield className="w-4 h-4" />
            {createMutation.isPending ? "Posting..." : "Post Anonymously"}
          </Button>
        </Card>
      )}

      {/* Problems list */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))
      ) : problems && problems.length > 0 ? (
        <div className="space-y-3">
          {problems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              isExpanded={expandedProblem === problem.id}
              onToggle={() => setExpandedProblem(expandedProblem === problem.id ? null : problem.id)}
              currentUserId={user?.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-7 h-7 text-primary/40" />
          </div>
          <p className="text-sm font-medium">No concerns shared yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to share. The community is here to help.</p>
        </div>
      )}

      {/* Info card */}
      <Card className="p-4 border border-border/60">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" />
          Collective Thinking
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When many minds come together, solutions emerge. Share your problem anonymously, and let the community's diverse experiences and perspectives light your path to peace.
        </p>
      </Card>
    </div>
  );
}

function ProblemCard({
  problem,
  isExpanded,
  onToggle,
  currentUserId,
}: {
  problem: Problem;
  isExpanded: boolean;
  onToggle: () => void;
  currentUserId?: string;
}) {
  const isOwnProblem = currentUserId === problem.user_id;

  return (
    <Card className="border border-border/60 overflow-hidden" data-testid={`problem-${problem.id}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
            <Eye className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{problem.title}</span>
              {isOwnProblem && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">You</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{problem.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px]">{problem.category}</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {getTimeAgo(problem.created_at)}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <div className="flex items-center gap-1 text-xs text-primary">
                <MessageCircle className="w-3.5 h-3.5" />
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <CommentSection
          problemId={problem.id}
          problemUserId={problem.user_id}
          currentUserId={currentUserId}
        />
      )}
    </Card>
  );
}

function CommentSection({
  problemId,
  problemUserId,
  currentUserId,
}: {
  problemId: string;
  problemUserId: string;
  currentUserId?: string;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const isOriginalPoster = currentUserId === problemUserId;

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/problems", problemId, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/problems/${problemId}/comments`);
      return res.json();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/problems/${problemId}/comments`, {
        message,
        isAnonymous: isOriginalPoster, // Original poster stays anonymous
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "comments"] });
      setMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not post comment.", variant: "destructive" });
    },
  });

  return (
    <div className="border-t border-border/60 bg-muted/20">
      {/* Comments */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {isLoading ? (
          <Skeleton className="h-12" />
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => {
            const isOP = comment.user_id === problemUserId;
            const isSelf = comment.user_id === currentUserId;
            return (
              <div
                key={comment.id}
                className={`flex gap-2.5 ${isSelf ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isOP
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600"
                    : "bg-primary/10 text-primary"
                }`}>
                  {isOP ? "OP" : comment.author_name.charAt(0)}
                </div>
                <div className={`max-w-[80%] ${isSelf ? "text-right" : ""}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isOP
                      ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
                      : isSelf
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-background border border-border/60"
                  }`}>
                    {comment.message}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 px-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {isOP ? "Anonymous (OP)" : comment.author_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {getTimeAgo(comment.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No responses yet. Be the first to offer support.
          </p>
        )}
      </div>

      {/* Comment input */}
      <div className="p-3 border-t border-border/40 flex gap-2">
        <Input
          placeholder={isOriginalPoster ? "Reply anonymously as OP..." : "Share your thoughts or advice..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && message.trim()) {
              commentMutation.mutate();
            }
          }}
          className="text-sm"
          data-testid={`comment-input-${problemId}`}
        />
        <Button
          size="sm"
          onClick={() => commentMutation.mutate()}
          disabled={!message.trim() || commentMutation.isPending}
          className="shrink-0 gap-1"
          data-testid={`comment-send-${problemId}`}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}