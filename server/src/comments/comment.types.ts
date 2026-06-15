export interface CommentRow {
  id: string;
  activity_id: string;
  user_id: string;
  body: string;
  created_at: Date;
  author_name: string;
  author_photo: string | null;
}

export interface CommentOwnershipRow {
  comment_user_id: string;
  activity_user_id: string;
}

export interface CommentOut {
  id: string;
  activityId: string;
  author: { id: string; displayName: string; photoUrl: string | null };
  body: string;
  createdAt: Date;
}
