import openpyxl, os
path = 'c:/Users/MUHWAJDI/OneDrive - Schenker AG/Documents/Project/WCup_2026_4.2.7_en_copy.xlsx'
wb = openpyxl.load_workbook(path, data_only=True)
rows = list(wb['DailySchedule'].iter_rows(values_only=True))
print(len(rows))
for i in range(110,146):
    print(i, rows[i])
