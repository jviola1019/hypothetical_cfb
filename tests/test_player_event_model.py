import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from player_event_model import (train_priors, next_event_probability, chronological_evaluation,
                                validate_priors, VERSION)


class PlayerEventResearchTest(unittest.TestCase):
    def setUp(self):
        self.players = [
            {'position':'QB','stat':'passingYards','line':250.5,
             'values':[240,280,300,150,340,275,290,180,310,205]}
            for _ in range(5)
        ]
        self.priors = train_priors(self.players)

    def test_train_prior_does_not_contain_athlete_ids_or_game_logs(self):
        self.assertEqual(self.priors['trainingSeason'], 2025)
        self.assertIn('QB:passingYards', self.priors['cohorts'])
        self.assertNotIn('players', self.priors)
        self.assertNotIn('gameIds', self.priors)

    def test_posterior_uses_only_prefix_and_has_bounded_interval(self):
        a = next_event_probability(self.priors,'QB','passingYards',[0,1,1])
        b = next_event_probability(self.priors,'QB','passingYards',[0,1,1])
        self.assertEqual(a,b)
        self.assertGreater(a['probability'],0)
        self.assertLess(a['probability'],1)
        self.assertLessEqual(a['approxInterval90'][0],a['probability'])
        self.assertGreaterEqual(a['approxInterval90'][1],a['probability'])
        self.assertIsNone(next_event_probability(self.priors,'QB','passingYards',[1,0]))

    def test_future_outcome_changes_no_prior_prediction(self):
        prefix = [1,0,0,1]
        earlier = next_event_probability(self.priors,'QB','passingYards',prefix)
        unrelated_future = [0,0,0,1,1,1,1,1,1]
        self.assertEqual(earlier,next_event_probability(self.priors,'QB','passingYards',prefix))
        self.assertNotEqual(earlier,next_event_probability(self.priors,'QB','passingYards',prefix+unrelated_future))

    def test_2026_evaluation_is_separate_from_training(self):
        future = [{'position':'QB','stat':'passingYards','line':250.5,
                   'values':[205,270,300,230,335,280]}]
        result = chronological_evaluation(future,self.priors)
        self.assertEqual(result['modelVersion'],VERSION)
        self.assertEqual(result['model']['n'],3)
        self.assertEqual(result['cohortPriorOnlyBaseline']['n'],3)
        self.assertTrue(0 <= result['model']['brier'] <= 1)
        self.assertIn('conditional-event-game',result['classification'])

    def test_invalid_priors_rejected(self):
        broken = {**self.priors, 'trainingSeason': 2026}
        with self.assertRaises(ValueError):validate_priors(broken)
        with self.assertRaises(ValueError):chronological_evaluation([],broken)


if __name__=='__main__':unittest.main()
