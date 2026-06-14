import openpyxl, os, json
path = 'c:/Users/MUHWAJDI/OneDrive - Schenker AG/Documents/Project/WCup_2026_4.2.7_en_copy.xlsx'
wb = openpyxl.load_workbook(path, data_only=True)
rows = list(wb['DailySchedule'].iter_rows(values_only=True))

stage = 'group'
groups = {}
group_matches = []
knockout_matches = []
for row in rows:
    if not row or len(row) < 9:
        continue
    if row[1] == 'Round of 32':
        stage = 'r32'
        continue
    if row[1] == 'Round of 16':
        stage = 'r16'
        continue
    if row[1] == 'Quarter final':
        stage = 'qf'
        continue
    if row[1] == 'Semi-Final':
        stage = 'sf'
        continue
    if row[1] == 'Third place':
        stage = 'third'
        continue
    if row[1] == 'Final':
        stage = 'final'
        continue
    pos1 = row[6]
    pos2 = row[7]
    if stage == 'group' and isinstance(row[3], str) and isinstance(row[4], str):
        team1, team2 = row[3], row[4]
        if team1.strip() == 'Team 1' and team2.strip() == 'Team 2':
            continue
        date = row[1]
        time = row[2]
        match_no = row[5]
        venue = row[8]
        group_letter = pos1[0] if isinstance(pos1, str) and len(pos1) else None
        match = {
            'matchNo': match_no,
            'date': date.isoformat() if hasattr(date, 'isoformat') else str(date),
            'time': time.strftime('%H:%M') if hasattr(time, 'strftime') else str(time),
            'team1': team1,
            'team2': team2,
            'pos1': pos1,
            'pos2': pos2,
            'venue': venue,
            'stage': stage
        }
        group_matches.append(match)
        if group_letter:
            groups.setdefault(group_letter, set()).update([team1, team2])
    elif stage != 'group' and pos1 and pos2:
        date = row[1]
        time = row[2]
        match_no = row[5]
        venue = row[8]
        match = {
            'matchNo': match_no,
            'date': date.isoformat() if hasattr(date, 'isoformat') else str(date),
            'time': time.strftime('%H:%M') if hasattr(time, 'strftime') else str(time),
            'team1': None,
            'team2': None,
            'pos1': pos1,
            'pos2': pos2,
            'venue': venue,
            'stage': stage
        }
        knockout_matches.append(match)

for k in sorted(groups.keys()):
    groups[k] = sorted(groups[k])

out = {'groups': groups, 'groupMatches': group_matches, 'knockoutMatches': knockout_matches}
with open('schedule_data.json','w', encoding='utf-8') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print('group matches', len(group_matches))
print('knockout matches', len(knockout_matches))
print('groups', list(groups.keys()))
