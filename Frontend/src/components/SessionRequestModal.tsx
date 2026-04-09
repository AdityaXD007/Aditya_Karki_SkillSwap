import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestsAPI, type Match } from "@/services";
import { toast } from "sonner";
import { Loader2, CalendarClock } from "lucide-react";

interface SessionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
}

export const SessionRequestModal: React.FC<SessionRequestModalProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [proposedDuration, setProposedDuration] = useState("60");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!match) return null;

  const teacher = (match as any).teacher;
  const skills = (match as any).skills || [];

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill you want to learn");
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        partner: teacher.id,
        skill_to_learn: parseInt(selectedSkillId),
        message: message,
        session_length: parseInt(proposedDuration),
      };

      // Include proposed_time only if both date and time are filled
      if (proposedDate && proposedTime) {
        payload.proposed_time = `${proposedDate}T${proposedTime}:00`;
      }

      await requestsAPI.sendRequest(payload);
      toast.success("Connection request sent!");
      onClose();
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error(error.response?.data?.detail || "Failed to send request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect with {teacher.username}</DialogTitle>
          <DialogDescription>
            Send a request to start learning from {teacher.username}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Skill you want to learn</Label>
            <Select onValueChange={setSelectedSkillId} value={selectedSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((s: any) => {
                  const sId = s.skill_id || s.id;
                  return (
                    <SelectItem key={sId} value={sId.toString()}>
                      {s.name || s.skill_details?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Proposed Duration (minutes)</Label>
            <Select
              onValueChange={setProposedDuration}
              value={proposedDuration}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Propose a Time (Optional) */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-500" />
              Propose a time (optional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={proposedDate}
                min={getMinDate()}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Date"
              />
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Time"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Suggest a date & time. The teacher can confirm or change it.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'd love to learn this skill from you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
