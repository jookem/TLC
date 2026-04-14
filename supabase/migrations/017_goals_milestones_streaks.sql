-- Goal milestones (sub-tasks per goal, managed by teacher, checked off by student)
create table goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references student_goals(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table goal_milestones enable row level security;

create policy "Students read own milestones" on goal_milestones
  for select using (student_id = auth.uid());

create policy "Students update own milestones" on goal_milestones
  for update using (student_id = auth.uid());

create policy "Teachers full access to milestones" on goal_milestones
  for all using (
    exists (
      select 1 from student_goals sg
      where sg.id = goal_milestones.goal_id
      and sg.teacher_id = auth.uid()
    )
  );

-- Study logs (one row per student per day — used for streak calculation)
create table study_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  studied_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (student_id, studied_date)
);

alter table study_logs enable row level security;

create policy "Students manage own study logs" on study_logs
  for all using (student_id = auth.uid());
