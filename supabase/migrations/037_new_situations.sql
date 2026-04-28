-- Situations for Alex, Dr. Chen, and Ms. Park

INSERT INTO situations (id, title, description, age_groups, category, npc_id, background_color, difficulty, mode, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222204',
   'A Chat at Work',
   'Casual conversation with a colleague at the office',
   ARRAY['teens','adults'], 'workplace',
   '11111111-1111-1111-1111-111111111104', '#5c7a8c', 'intermediate', 'scripted', true),

  ('22222222-2222-2222-2222-222222222205',
   'At the Doctor''s',
   'A medical appointment — describe your symptoms and follow advice',
   ARRAY['teens','adults'], 'medical',
   '11111111-1111-1111-1111-111111111102', '#7ba7bc', 'intermediate', 'scripted', true),

  ('22222222-2222-2222-2222-222222222206',
   'After Class',
   'Ask your teacher about homework, grammar, or just say hello',
   ARRAY['children','teens'], 'school',
   '11111111-1111-1111-1111-111111111103', '#a89070', 'beginner', 'scripted', true);


INSERT INTO situation_scripts (id, situation_id, script) VALUES

('33333333-3333-3333-3333-333333333304',
 '22222222-2222-2222-2222-222222222204',
 '{"nodes":[
   {"id":"start","speaker":"npc","text":"Hey! How was your weekend?","expression":"positive","next":"q1"},
   {"id":"q1","speaker":"student","options":[
     {"text":"It was great! I went to the park.","next":"r1a"},
     {"text":"Pretty busy, actually.","next":"r1b"},
     {"text":"It was okay, nothing special.","next":"r1c"}
   ]},
   {"id":"r1a","speaker":"npc","text":"Nice! The weather was perfect. I should have gone outside too.","expression":"positive","next":"q2"},
   {"id":"r1b","speaker":"npc","text":"I know that feeling. At least the week is just starting!","expression":"thinking","next":"q2"},
   {"id":"r1c","speaker":"npc","text":"A relaxing weekend is good too! Ready for another busy week?","expression":"neutral","next":"q2"},
   {"id":"q2","speaker":"npc","text":"Hey, are you free for lunch? There is a new ramen place I want to try.","expression":"positive","next":"q2opts"},
   {"id":"q2opts","speaker":"student","options":[
     {"text":"Sure! Ramen sounds great!","next":"r2a"},
     {"text":"Sorry, I have a meeting at noon.","next":"r2b"}
   ]},
   {"id":"r2a","speaker":"npc","text":"Awesome! Meet me at the elevator at 12:30. I heard the tonkotsu is amazing.","expression":"positive","next":"q3"},
   {"id":"r2b","speaker":"npc","text":"No worries! Maybe tomorrow then. I will save the ramen for another day.","expression":"neutral","next":"q3"},
   {"id":"q3","speaker":"npc","text":"Oh, one more thing — did you finish the report for today''s meeting?","expression":"confused","next":"q3opts"},
   {"id":"q3opts","speaker":"student","options":[
     {"text":"Yes, I finished it this morning!","next":"end_a"},
     {"text":"Almost — just a few more things to add.","next":"end_b"}
   ]},
   {"id":"end_a","speaker":"npc","text":"Perfect! You are so organised. See you at the meeting!","expression":"positive"},
   {"id":"end_b","speaker":"npc","text":"No rush — we still have time. Good luck finishing it!","expression":"positive"}
 ]}'::jsonb),

('33333333-3333-3333-3333-333333333305',
 '22222222-2222-2222-2222-222222222205',
 '{"nodes":[
   {"id":"start","speaker":"npc","text":"Hello! Please have a seat. What brings you in today?","expression":"neutral","next":"q1"},
   {"id":"q1","speaker":"student","options":[
     {"text":"I have a sore throat and a bit of a fever.","next":"r1a"},
     {"text":"I have had a headache for a few days.","next":"r1b"},
     {"text":"I have been feeling really tired lately.","next":"r1c"}
   ]},
   {"id":"r1a","speaker":"npc","text":"I see. How long have you had the sore throat?","expression":"thinking","next":"q2a"},
   {"id":"q2a","speaker":"student","options":[
     {"text":"Since yesterday.","next":"r2a_short"},
     {"text":"For about three days now.","next":"r2a_long"}
   ]},
   {"id":"r2a_short","speaker":"npc","text":"It could just be the start of a cold. Let me check your throat.","expression":"neutral","next":"check"},
   {"id":"r2a_long","speaker":"npc","text":"Three days is a while. I need to check your temperature and throat.","expression":"thinking","next":"check"},
   {"id":"r1b","speaker":"npc","text":"Headaches can have many causes. Have you been sleeping well?","expression":"thinking","next":"q2b"},
   {"id":"q2b","speaker":"student","options":[
     {"text":"Not really. I have been staying up late.","next":"r2b_late"},
     {"text":"Yes, I sleep about eight hours a night.","next":"r2b_ok"}
   ]},
   {"id":"r2b_late","speaker":"npc","text":"Lack of sleep is a very common cause of headaches. Rest is so important.","expression":"neutral","next":"check"},
   {"id":"r2b_ok","speaker":"npc","text":"Good sleep habits. It may be stress or eye strain. Let me check.","expression":"thinking","next":"check"},
   {"id":"r1c","speaker":"npc","text":"Fatigue can have many causes. Are you eating and sleeping well?","expression":"thinking","next":"q2c"},
   {"id":"q2c","speaker":"student","options":[
     {"text":"Mostly, but I have been pretty stressed.","next":"r2c_stress"},
     {"text":"Not really. I skip meals sometimes.","next":"r2c_skip"}
   ]},
   {"id":"r2c_stress","speaker":"npc","text":"Stress really does affect our bodies. Let us do a quick check-up.","expression":"neutral","next":"check"},
   {"id":"r2c_skip","speaker":"npc","text":"Regular meals are very important for energy. Let us check your health.","expression":"neutral","next":"check"},
   {"id":"check","speaker":"npc","text":"I will write a prescription. Drink plenty of water and rest well. Come back in three days if you do not feel better.","expression":"positive","next":"q_final"},
   {"id":"q_final","speaker":"student","options":[
     {"text":"Thank you, Doctor. I will do that.","next":"end_a"},
     {"text":"Should I take any medicine?","next":"end_b"}
   ]},
   {"id":"end_a","speaker":"npc","text":"Take care! Feel better soon.","expression":"positive"},
   {"id":"end_b","speaker":"npc","text":"Yes, the prescription covers that. The pharmacy is on the first floor. Feel better soon!","expression":"positive"}
 ]}'::jsonb),

('33333333-3333-3333-3333-333333333306',
 '22222222-2222-2222-2222-222222222206',
 '{"nodes":[
   {"id":"start","speaker":"npc","text":"Oh, hello! Did you have a question about today''s lesson?","expression":"positive","next":"q1"},
   {"id":"q1","speaker":"student","options":[
     {"text":"Yes, I did not understand the grammar part.","next":"r1a"},
     {"text":"I wanted to ask about the homework.","next":"r1b"},
     {"text":"I just wanted to say — great class today!","next":"r1c"}
   ]},
   {"id":"r1a","speaker":"npc","text":"Of course! Grammar can be tricky. Which part was confusing?","expression":"neutral","next":"q2a"},
   {"id":"q2a","speaker":"student","options":[
     {"text":"The present perfect tense.","next":"r2a_pp"},
     {"text":"When to use a or the.","next":"r2a_art"}
   ]},
   {"id":"r2a_pp","speaker":"npc","text":"Present perfect connects past experience to the present. For example: I have eaten sushi. Does that help?","expression":"positive","next":"q3"},
   {"id":"r2a_art","speaker":"npc","text":"Articles are tricky! Use a for something new, and the for something already known. Does that make sense?","expression":"positive","next":"q3"},
   {"id":"r1b","speaker":"npc","text":"Sure! The homework is on page 24 — write five sentences using today''s vocabulary.","expression":"neutral","next":"q2b"},
   {"id":"q2b","speaker":"student","options":[
     {"text":"When is it due?","next":"r2b_due"},
     {"text":"Can we work in pairs?","next":"r2b_pair"}
   ]},
   {"id":"r2b_due","speaker":"npc","text":"It is due next Wednesday. Take it step by step — you have plenty of time!","expression":"positive","next":"q3"},
   {"id":"r2b_pair","speaker":"npc","text":"Please do it individually this time. I want to see how each of you is doing.","expression":"neutral","next":"q3"},
   {"id":"r1c","speaker":"npc","text":"Oh, that is so kind! I am really glad you enjoyed it.","expression":"positive","next":"q3"},
   {"id":"q3","speaker":"npc","text":"Is there anything you would like to work on? I want to help you improve!","expression":"positive","next":"q3opts"},
   {"id":"q3opts","speaker":"student","options":[
     {"text":"I want to get better at speaking.","next":"end_a"},
     {"text":"I want to improve my writing.","next":"end_b"},
     {"text":"I think I am okay for now. Thank you!","next":"end_c"}
   ]},
   {"id":"end_a","speaker":"npc","text":"Great goal! Try speaking a little English every day. Practice makes perfect!","expression":"positive"},
   {"id":"end_b","speaker":"npc","text":"Writing takes time. Try keeping a diary in English — just a few sentences each day!","expression":"positive"},
   {"id":"end_c","speaker":"npc","text":"You are doing really well! Keep it up. See you next class!","expression":"positive"}
 ]}'::jsonb);
