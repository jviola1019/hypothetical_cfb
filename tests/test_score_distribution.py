import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from evaluate_score_distribution import (fit_training_residuals,check_forecasts,
    crps_ensemble,absolute_pair_penalty,empirical_quantile,make_chronological_predictions)


def row(index, offset=0, margin=0):
    return {'gameId':str(index), 'date':str(index), 'week':str(index%12),
      'y':int(margin>0),'home':1,'predMargin':3+offset,
      'actualMargin':margin, 'predTotal':47, 'actualTotal':50+index%9}

class ScoreModelTest(unittest.TestCase):
    def test_exact_crps_of_simple_two_sample_ensemble(self):
        draws=[-1,1]
        penalty=absolute_pair_penalty(draws)
        self.assertAlmostEqual(penalty,.5)
        self.assertAlmostEqual(crps_ensemble(0,0,draws,penalty),.5)

    def test_diagnostics_never_fit_evaluation_year_outcomes(self):
        fit=fit_training_residuals([row(n,margin=(n%5)-2) for n in range(50)])
        future=[row(n,margin=(n%9)-2) for n in range(6)]
        first=check_forecasts(future,fit)
        far=[row(n,margin=(n%9)+20) for n in range(6)]
        second=check_forecasts(far,fit)
        self.assertEqual(first['n'],second['n'])
        self.assertNotEqual(first['margin']['mae'],second['margin']['mae'])
        self.assertEqual(fit['Margin']['count'],50)
        self.assertEqual(fit['Margin']['q05'],empirical_quantile([r['actualMargin']-r['predMargin'] for r in [row(n,margin=n%5-2) for n in range(50)]],.05))

    def test_interval_coverage_and_prediction_are_bounded(self):
        fit=fit_training_residuals([row(n, margin=n%7-3) for n in range(70)])
        result=check_forecasts([row(n,margin=n%6-2) for n in range(35)],fit)
        self.assertGreaterEqual(result['winnerBrierFromMarginResiduals'],0)
        self.assertLessEqual(result['winnerBrierFromMarginResiduals'],1)
        for kind in ('margin','total'):
            self.assertTrue(0<=result[kind]['interval90Coverage']<=1)
            self.assertGreaterEqual(result[kind]['crps'],0)

    def test_requires_chronological_four_year_data(self):
        with self.assertRaises(ValueError):make_chronological_predictions({2024:[{'date':'2024-08-01'}]})

if __name__=='__main__':unittest.main()
