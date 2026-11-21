import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from evaluate_multiyear import evaluate,fit_logistic_pair,predict

class TestMultiyear(unittest.TestCase):
 def synthetic(self):
  data={}
  for y in (2023,2024,2025,2026):
   games=[]
   for i in range(48):
    h=f'team-{i%8}';a=f'team-{(i+1+i//8)%8}';
    if h==a:a='team-8'
    games.append({'date':f'{y}-09-{1+i//3:02d}T12:00:00.000Z','gameId':f'{y}-{i}',
                  'home':h,'away':a,'h':21+(i%6)*3,'a':14+(i%4)*3,'neutral':i%3==0,'week':str(i//10+1)})
   data[y]=games
  return data
 def test_predictions_deterministic_and_probabilities_bounded(self):
  a=evaluate(self.synthetic(),'2026-11-21');b=evaluate(self.synthetic(),'2026-11-21')
  self.assertEqual(a,b)
  self.assertEqual(a['gamesBySeason'],{str(y):48 for y in (2023,2024,2025,2026)})
  self.assertTrue(0<=a['evaluation']['2026'][a['modelSelectedOn2025']]['brier']<=1)
 def test_2026_result_mutation_cannot_change_training_or_model_choice(self):
  a=self.synthetic();b=self.synthetic()
  for g in b[2026]:g['h'],g['a']=g['a'],g['h']
  x=evaluate(a,'2026-11-21');y=evaluate(b,'2026-11-21')
  self.assertEqual(x['modelCoefficientsFitted2024'],y['modelCoefficientsFitted2024'])
  self.assertEqual(x['modelSelectedOn2025'],y['modelSelectedOn2025'])
  self.assertNotEqual(x['evaluation']['2026'][x['modelSelectedOn2025']]['brier'],y['evaluation']['2026'][y['modelSelectedOn2025']]['brier'])
 def test_neutral_team_swap_complement(self):
  x=evaluate(self.synthetic(),'2026-11-21');params=x['modelCoefficientsFitted2024']
  f={'z':0.7,'m':5.,'home':0,'y':1}
  g={'z':-0.7,'m':-5.,'home':0,'y':0}
  for model in ['coin','homeOnly','elo','margin','fixedBlend','logisticPair']:
   self.assertAlmostEqual(predict(f,params)[model]+predict(g,params)[model],1.,places=12)

if __name__=='__main__':unittest.main()
