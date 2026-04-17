create extension if not exists "pgcrypto";

create table if not exists personas (
  id text primary key,
  slug text not null unique,
  name text not null,
  avatar text,
  era text not null,
  category text not null,
  short_bio text not null,
  long_bio text not null,
  style_keywords text[] not null default '{}',
  suggested_questions text[] not null default '{}',
  disclaimer text not null,
  persona_config jsonb not null,
  safety_boundary text[] not null default '{}',
  system_prompt text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  persona_id text not null references personas(id) on delete cascade,
  title text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id text primary key,
  message_id text not null references messages(id) on delete cascade,
  persona_id text not null references personas(id) on delete cascade,
  type text not null check (type in ('like', 'unlike', 'off_topic', 'too_generic', 'too_modern')),
  created_at timestamptz not null default now()
);

create table if not exists saved_quotes (
  id text primary key,
  message_id text not null references messages(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  conversation_title text not null,
  persona_id text not null references personas(id) on delete cascade,
  persona_name text not null,
  content text not null,
  footnotes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_persona_updated_idx
  on conversations (persona_id, updated_at desc);

create index if not exists messages_conversation_created_idx
  on messages (conversation_id, created_at asc);

create index if not exists feedback_message_idx
  on feedback (message_id);

create unique index if not exists feedback_message_unique_idx
  on feedback (message_id);

create index if not exists saved_quotes_conversation_idx
  on saved_quotes (conversation_id, created_at desc);

create unique index if not exists saved_quotes_message_unique_idx
  on saved_quotes (message_id);

alter table personas enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table feedback enable row level security;
alter table saved_quotes enable row level security;

drop policy if exists "public can read personas" on personas;
create policy "public can read personas"
  on personas for select
  using (true);

drop policy if exists "users can read own conversations" on conversations;
create policy "users can read own conversations"
  on conversations for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own conversations" on conversations;
create policy "users can insert own conversations"
  on conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own conversations" on conversations;
create policy "users can update own conversations"
  on conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own conversations" on conversations;
create policy "users can delete own conversations"
  on conversations for delete
  using (auth.uid() = user_id);

drop policy if exists "users can read own messages" on messages;
create policy "users can read own messages"
  on messages for select
  using (
    exists (
      select 1
      from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can insert own messages" on messages;
create policy "users can insert own messages"
  on messages for insert
  with check (
    exists (
      select 1
      from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can delete own messages" on messages;
create policy "users can delete own messages"
  on messages for delete
  using (
    exists (
      select 1
      from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can read own feedback" on feedback;
create policy "users can read own feedback"
  on feedback for select
  using (
    exists (
      select 1
      from messages
      join conversations on conversations.id = messages.conversation_id
      where messages.id = feedback.message_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can insert own feedback" on feedback;
create policy "users can insert own feedback"
  on feedback for insert
  with check (
    exists (
      select 1
      from messages
      join conversations on conversations.id = messages.conversation_id
      where messages.id = feedback.message_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can update own feedback" on feedback;
create policy "users can update own feedback"
  on feedback for update
  using (
    exists (
      select 1
      from messages
      join conversations on conversations.id = messages.conversation_id
      where messages.id = feedback.message_id
        and conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from messages
      join conversations on conversations.id = messages.conversation_id
      where messages.id = feedback.message_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can delete own feedback" on feedback;
create policy "users can delete own feedback"
  on feedback for delete
  using (
    exists (
      select 1
      from messages
      join conversations on conversations.id = messages.conversation_id
      where messages.id = feedback.message_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can read own saved quotes" on saved_quotes;
create policy "users can read own saved quotes"
  on saved_quotes for select
  using (
    exists (
      select 1
      from conversations
      where conversations.id = saved_quotes.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can insert own saved quotes" on saved_quotes;
create policy "users can insert own saved quotes"
  on saved_quotes for insert
  with check (
    exists (
      select 1
      from conversations
      where conversations.id = saved_quotes.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can update own saved quotes" on saved_quotes;
create policy "users can update own saved quotes"
  on saved_quotes for update
  using (
    exists (
      select 1
      from conversations
      where conversations.id = saved_quotes.conversation_id
        and conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from conversations
      where conversations.id = saved_quotes.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "users can delete own saved quotes" on saved_quotes;
create policy "users can delete own saved quotes"
  on saved_quotes for delete
  using (
    exists (
      select 1
      from conversations
      where conversations.id = saved_quotes.conversation_id
        and conversations.user_id = auth.uid()
    )
  );
