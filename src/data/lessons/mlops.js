export default {
  "ml-lifecycle": {
    "sections": [
      {
        "heading": "From code to feedback loop",
        "body": [
          {
            "type": "p",
            "text": "Traditional software ships **logic**. ML systems ship **learned behavior** — and that behavior decays the moment the world shifts under it. That single fact reshapes everything downstream: how you test, how you deploy, how you sleep at night."
          },
          {
            "type": "p",
            "text": "The ML lifecycle is the **closed loop** you build to keep a model honest. Eight stages, each with its own failure mode, all wired together so production teaches you what training couldn't."
          }
        ]
      },
      {
        "heading": "The eight stages",
        "body": [
          {
            "type": "p",
            "text": "Read this as a *cycle*, not a pipeline. The dashed edges are where **data and feedback flow** — the loop is closed by drift detection sending you back to retrain."
          },
          {
            "type": "diagram",
            "title": "ML lifecycle as a closed loop",
            "nodes": [
              {
                "id": "data",
                "label": "Data",
                "subtitle": "collect + clean",
                "x": 0.08,
                "y": 0.25,
                "accent": "earth"
              },
              {
                "id": "feat",
                "label": "Features",
                "subtitle": "transform",
                "x": 0.28,
                "y": 0.1,
                "accent": "earth"
              },
              {
                "id": "train",
                "label": "Train",
                "subtitle": "fit θ",
                "x": 0.5,
                "y": 0.05,
                "accent": "sky"
              },
              {
                "id": "eval",
                "label": "Evaluate",
                "subtitle": "holdout metrics",
                "x": 0.72,
                "y": 0.1,
                "accent": "sky"
              },
              {
                "id": "deploy",
                "label": "Deploy",
                "subtitle": "serve at scale",
                "x": 0.92,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "monitor",
                "label": "Monitor",
                "subtitle": "latency + quality",
                "x": 0.85,
                "y": 0.7,
                "accent": "fire"
              },
              {
                "id": "drift",
                "label": "Drift",
                "subtitle": "detect shift",
                "x": 0.5,
                "y": 0.88,
                "accent": "fire"
              },
              {
                "id": "retrain",
                "label": "Retrain",
                "subtitle": "back to data",
                "x": 0.15,
                "y": 0.7,
                "accent": "water"
              }
            ],
            "edges": [
              {
                "from": "data",
                "to": "feat",
                "kind": "dashed",
                "label": "raw",
                "accent": "earth"
              },
              {
                "from": "feat",
                "to": "train",
                "kind": "dashed",
                "label": "X, y",
                "accent": "sky"
              },
              {
                "from": "train",
                "to": "eval",
                "kind": "solid",
                "label": "model",
                "accent": "sky"
              },
              {
                "from": "eval",
                "to": "deploy",
                "kind": "dashed",
                "label": "promote",
                "accent": "amber"
              },
              {
                "from": "deploy",
                "to": "monitor",
                "kind": "dashed",
                "label": "predictions",
                "accent": "fire"
              },
              {
                "from": "monitor",
                "to": "drift",
                "kind": "solid",
                "label": "signals",
                "accent": "fire"
              },
              {
                "from": "drift",
                "to": "retrain",
                "kind": "dashed",
                "label": "trigger",
                "accent": "water"
              },
              {
                "from": "retrain",
                "to": "data",
                "kind": "dashed",
                "label": "refresh",
                "accent": "water"
              }
            ]
          }
        ]
      },
      {
        "heading": "Traditional software vs ML systems",
        "body": [
          {
            "type": "p",
            "text": "The mental model you brought from web services will mislead you. ML systems carry a **second source of truth** — the data — and it ages."
          },
          {
            "type": "table",
            "headers": [
              "Concern",
              "Traditional",
              "ML system"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Behavior defined by",
                "code",
                "code **+** data **+** weights"
              ],
              [
                "Tests catch regressions?",
                "✓",
                "✗ (metrics drift silently)"
              ],
              [
                "Decays without changes?",
                "✗",
                "✓ (world shifts → accuracy drops)"
              ],
              [
                "Rollback restores correctness?",
                "✓",
                "✗ (old model may also be stale)"
              ],
              [
                "Reproducible build",
                "git SHA",
                "git SHA **+** data SHA **+** seed"
              ],
              [
                "Primary failure mode",
                "exception",
                "**quietly wrong** output"
              ]
            ]
          },
          {
            "type": "quote",
            "text": "All models are wrong, but some are useful.",
            "cite": "George Box"
          }
        ]
      },
      {
        "heading": "The vocabulary you need",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Training",
                "def": "Fitting parameters θ to minimize loss on labeled data — the math step."
              },
              {
                "term": "Evaluation",
                "def": "Measuring model quality on a *held-out* set the model never saw during training."
              },
              {
                "term": "Inference",
                "def": "Running the trained model on new inputs in production to produce predictions."
              },
              {
                "term": "Drift",
                "def": "When the live data distribution diverges from training data — accuracy degrades even though the model is unchanged."
              },
              {
                "term": "Feature store",
                "def": "Versioned cache of computed features, shared between training and serving to prevent **train-serve skew**."
              },
              {
                "term": "Retraining",
                "def": "Refitting on fresher data — scheduled, or triggered when drift crosses a threshold."
              }
            ]
          }
        ]
      },
      {
        "heading": "A minimal loop in code",
        "body": [
          {
            "type": "p",
            "text": "Strip the lifecycle to its bones and it's roughly this. Note where the **artifacts cross stages** — that's where versioning matters most."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "X, y = load('s3://data/v3.parquet')  # data SHA pins reproducibility\nX = featurize(X, store='feat:v12')  # same transform train + serve\n\nmodel = GradientBoostedTrees(seed=42)  # seed = reproducible θ\nmodel.fit(X_train, y_train)  # the actual learning step\n\nauc = roc_auc(model, X_holdout, y_holdout)  # holdout — never trained on\nassert auc > 0.82, 'gate: do not promote'  # eval gate blocks bad models\n\nregistry.publish(model, tag='v3', auc=auc)  # immutable artifact + lineage\ndeploy('serving-v3', traffic=0.05)  # canary 5% before full rollout\n\nfor batch in monitor.stream():  # live predictions, sampled\n    if ks_test(batch.features, X_train) < 0.01:  # KS detects feature drift\n        trigger('retrain', reason='drift')  # closes the loop"
          }
        ]
      },
      {
        "heading": "When it matters: the loop is the product",
        "body": [
          {
            "type": "p",
            "text": "Teams that treat ML like traditional deploys hit the same wall: model ships, metrics look great for two weeks, then **silent decay**. No alarms fire because no exceptions throw."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Owning the full loop buys you",
            "watchLabel": "Skipping stages costs you",
            "good": [
              "Drift detected in **hours**, not quarterly review meetings",
              "Reproducible models — same data SHA + seed → same θ",
              "Safe rollback: you have prior model **and** the data that made it",
              "Retraining is a button, not a two-week project"
            ],
            "watch": [
              "No monitoring → you learn about decay from **customer complaints**",
              "No feature store → train-serve skew silently tanks accuracy",
              "No eval gate → bad models reach prod because deploy is automated",
              "No data versioning → 'works on my notebook' becomes permanent"
            ]
          },
          {
            "type": "p",
            "text": "**Key insight**: in ML, the deploy is the *beginning* of the work, not the end. Every stage after `train` exists because the model will be wrong tomorrow in ways it isn't wrong today — and your job is to notice before your users do."
          }
        ]
      }
    ]
  },
  "training-eval": {
    "sections": [
      {
        "heading": "The training loop, end to end",
        "body": [
          {
            "type": "p",
            "text": "Training a model is a **loop**: feed data forward, measure how wrong you are, push the error backward, nudge the weights. Repeat until the loss stops dropping. Everything else in this lesson — splits, metrics, overfitting — is scaffolding around that loop."
          },
          {
            "type": "p",
            "text": "The hard part isn't the math. It's knowing **when to stop**, **which metric to trust**, and **whether your model learned the task or just memorized the answers**."
          }
        ]
      },
      {
        "heading": "Split your data three ways",
        "body": [
          {
            "type": "p",
            "text": "Before you train anything, carve the dataset into three disjoint slices. The **train** set teaches the model. The **validation** set tunes hyperparameters and triggers early stopping. The **test** set is held in a vault and touched exactly once — at the end."
          },
          {
            "type": "diagram",
            "title": "Dataset → train / val / test",
            "height": 260,
            "nodes": [
              {
                "id": "data",
                "label": "Raw dataset",
                "subtitle": "100% labeled",
                "x": 0.08,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "train",
                "label": "Train",
                "subtitle": "70% · fits weights",
                "x": 0.45,
                "y": 0.18,
                "accent": "sky"
              },
              {
                "id": "val",
                "label": "Validation",
                "subtitle": "15% · tunes η, depth",
                "x": 0.45,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "test",
                "label": "Test",
                "subtitle": "15% · touched once",
                "x": 0.45,
                "y": 0.82,
                "accent": "earth"
              },
              {
                "id": "model",
                "label": "Model",
                "subtitle": "θ updated each epoch",
                "x": 0.82,
                "y": 0.34,
                "accent": "fire"
              },
              {
                "id": "report",
                "label": "Final report",
                "subtitle": "honest accuracy",
                "x": 0.82,
                "y": 0.82,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "data",
                "to": "train",
                "kind": "dashed",
                "label": "70%",
                "accent": "sky"
              },
              {
                "from": "data",
                "to": "val",
                "kind": "dashed",
                "label": "15%",
                "accent": "water"
              },
              {
                "from": "data",
                "to": "test",
                "kind": "dashed",
                "label": "15%",
                "accent": "earth"
              },
              {
                "from": "train",
                "to": "model",
                "kind": "solid",
                "label": "fit",
                "accent": "sky"
              },
              {
                "from": "val",
                "to": "model",
                "kind": "dashed",
                "label": "tune",
                "accent": "water"
              },
              {
                "from": "test",
                "to": "report",
                "kind": "dashed",
                "label": "score once",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "Peeking at the test set during development is called **data leakage** — and it's the #1 reason ML demos look great in the notebook and embarrass you in production."
          }
        ]
      },
      {
        "heading": "Underfit, fit, overfit",
        "body": [
          {
            "type": "p",
            "text": "Every model lives somewhere on a spectrum from **too simple** to **too memorized**. The validation curve tells you where you are."
          },
          {
            "type": "diagram",
            "title": "Three regimes of the same regression task",
            "height": 240,
            "nodes": [
              {
                "id": "u1",
                "label": "Underfit",
                "subtitle": "high bias",
                "x": 0.18,
                "y": 0.22,
                "accent": "water"
              },
              {
                "id": "u2",
                "label": "train↑ val↑",
                "subtitle": "both wrong",
                "x": 0.18,
                "y": 0.72,
                "accent": "water"
              },
              {
                "id": "f1",
                "label": "Good fit",
                "subtitle": "generalizes",
                "x": 0.5,
                "y": 0.22,
                "accent": "sky"
              },
              {
                "id": "f2",
                "label": "train↓ val↓",
                "subtitle": "both low",
                "x": 0.5,
                "y": 0.72,
                "accent": "sky"
              },
              {
                "id": "o1",
                "label": "Overfit",
                "subtitle": "memorized",
                "x": 0.82,
                "y": 0.22,
                "accent": "fire"
              },
              {
                "id": "o2",
                "label": "train↓ val↑",
                "subtitle": "gap widens",
                "x": 0.82,
                "y": 0.72,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "u1",
                "to": "u2",
                "kind": "solid",
                "accent": "water"
              },
              {
                "from": "f1",
                "to": "f2",
                "kind": "solid",
                "accent": "sky"
              },
              {
                "from": "o1",
                "to": "o2",
                "kind": "solid",
                "accent": "fire"
              },
              {
                "from": "u1",
                "to": "f1",
                "kind": "dashed",
                "label": "more capacity",
                "accent": "amber"
              },
              {
                "from": "f1",
                "to": "o1",
                "kind": "dashed",
                "label": "too much",
                "accent": "amber"
              }
            ]
          },
          {
            "type": "p",
            "text": "Diagnose by watching train loss vs val loss together. Both high → **underfit** (add layers, train longer). Both low and close → **healthy**. Train low but val climbing → **overfit** (add dropout, regularization, or more data)."
          }
        ]
      },
      {
        "heading": "The metrics vocabulary",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Loss",
                "def": "A continuous score the model minimizes — cross-entropy for classification, MSE for regression. It's what gradients flow through."
              },
              {
                "term": "Accuracy",
                "def": "Fraction of predictions that are correct. Useless on imbalanced data — 99% accuracy on a 1% fraud dataset means you predicted 'no fraud' every time."
              },
              {
                "term": "Precision",
                "def": "Of the items you flagged positive, how many actually were? High precision = few false alarms."
              },
              {
                "term": "Recall",
                "def": "Of the items that were truly positive, how many did you catch? High recall = few misses."
              },
              {
                "term": "F1 score",
                "def": "Harmonic mean of precision and recall — punishes you for ignoring either. Use when the positive class is rare."
              }
            ]
          },
          {
            "type": "p",
            "text": "Pick the metric that matches the **cost of being wrong**. A spam filter wants high precision (don't trash real mail). A cancer screen wants high recall (don't miss a tumor)."
          },
          {
            "type": "predict",
            "prompt": "A fraud classifier on a dataset that's 1% fraud, 99% legit reports **99% accuracy**. The model predicts *every* transaction as legit. What does its recall on the fraud class look like?",
            "options": [
              "99% — accuracy and recall track together",
              "~50% — recall averages across classes",
              "0% — the model never flagged a single real fraud",
              "Undefined — recall doesn't apply to imbalanced data"
            ],
            "answer": 2,
            "explain": "Recall on the positive class is `TP / (TP + FN)`. If the model predicts \"legit\" for every transaction, then `TP = 0` (no real fraud was flagged) and every actual fraud is a false negative. Recall = `0 / (0 + 0.01·N) = 0%`. This is why accuracy is a trap on imbalanced data — predicting the majority class gives you a great-looking number on a useless model. F1 or per-class recall would have caught this immediately, which is why every fraud, churn, or rare-event model reports those instead of accuracy."
          }
        ]
      },
      {
        "heading": "Confusion matrix and the training loop in code",
        "body": [
          {
            "type": "p",
            "text": "Every binary classifier outcome falls into one of four buckets. Read rows as **truth**, columns as **prediction**:"
          },
          {
            "type": "table",
            "headers": [
              "",
              "Predicted: positive",
              "Predicted: negative"
            ],
            "align": [
              "left",
              "center",
              "center"
            ],
            "rows": [
              [
                "**Actual: positive**",
                "TP — caught it",
                "FN — missed it"
              ],
              [
                "**Actual: negative**",
                "FP — false alarm",
                "TN — correctly ignored"
              ],
              [
                "**formula**",
                "precision = TP / (TP+FP)",
                "recall = TP / (TP+FN)"
              ]
            ]
          },
          {
            "type": "p",
            "text": "And here's the loop those metrics watch — note that validation runs **every epoch** but never updates weights:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "for epoch in range(EPOCHS):\n    model.train()  # enables dropout, batchnorm updates\n    for xb, yb in train_loader:  # mini-batches keep memory bounded\n        logits = model(xb)  # forward pass\n        loss = F.cross_entropy(logits, yb)  # scalar, differentiable\n        opt.zero_grad()  # clear stale gradients\n        loss.backward()  # ∇θ via autograd\n        opt.step()  # θ ← θ − η·∇θ\n\n    model.eval()  # freezes dropout/batchnorm\n    with torch.no_grad():  # no graph = less memory\n        val_loss = score(model, val_loader)  # never touches train data\n    if val_loss > best + ε:  # patience check\n        bad_epochs += 1  # early stop counter\n        if bad_epochs >= PATIENCE: break  # stop before overfit"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Trust these signals",
            "watchLabel": "Red flags",
            "good": [
              "Val loss plateaus or rises while train loss keeps falling — **stop now**",
              "Train and val accuracy within ~2% of each other on a balanced set",
              "Confusion matrix examined per-class, not just overall accuracy",
              "Test set scored exactly once, after all tuning is frozen"
            ],
            "watch": [
              "99% accuracy on a 1%-positive dataset — you predicted the majority class",
              "Test accuracy >> val accuracy — your val set leaked into training",
              "Shuffling time-series data before splitting — you trained on the future",
              "Tuning hyperparameters against the test set — its score is now a lie"
            ]
          },
          {
            "type": "quote",
            "text": "The validation loss is the only number that tells you the truth. The training loss tells you what the model memorized.",
            "cite": "every ML engineer, eventually"
          },
          {
            "type": "p",
            "text": "**Key insight**: training isn't about minimizing loss — it's about minimizing the **gap** between training loss and the loss you'll see on data you haven't met yet. That's what splits, early stopping, and the held-out test set are all defending."
          }
        ]
      }
    ]
  },
  "ab-testing": {
    "sections": [
      {
        "heading": "Why A/B test ML at all",
        "body": [
          {
            "type": "p",
            "text": "Your offline AUC went up 0.4 points. Ship it? **No.** Offline metrics measure what the model predicts on logged data; A/B tests measure what users actually do when the model is in the loop. Those two numbers disagree more often than anyone wants to admit."
          },
          {
            "type": "p",
            "text": "An **A/B test** randomly splits live traffic between **control** (current model) and **treatment** (new model), then compares a **primary metric** under both. It's the only honest way to attribute a behavior change to the model change."
          }
        ]
      },
      {
        "heading": "The setup",
        "body": [
          {
            "type": "diagram",
            "title": "Traffic split for an ML A/B test",
            "nodes": [
              {
                "id": "u",
                "label": "Users",
                "subtitle": "requests",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "s",
                "label": "Splitter",
                "subtitle": "hash % 100",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "a",
                "label": "Model A",
                "subtitle": "control (prod)",
                "x": 0.62,
                "y": 0.22,
                "accent": "amber"
              },
              {
                "id": "b",
                "label": "Model B",
                "subtitle": "treatment (candidate)",
                "x": 0.62,
                "y": 0.78,
                "accent": "fire"
              },
              {
                "id": "m",
                "label": "Metrics store",
                "subtitle": "events",
                "x": 0.9,
                "y": 0.5,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "u",
                "to": "s",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "s",
                "to": "a",
                "kind": "dashed",
                "label": "50%",
                "accent": "amber"
              },
              {
                "from": "s",
                "to": "b",
                "kind": "dashed",
                "label": "50%",
                "accent": "fire"
              },
              {
                "from": "a",
                "to": "m",
                "kind": "solid",
                "accent": "earth"
              },
              {
                "from": "b",
                "to": "m",
                "kind": "solid",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "Assign on a **stable unit** — usually `user_id`, not `request_id`. Otherwise the same user bounces between variants and you've measured noise."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import hashlib\n\ndef assign(user_id: str, exp: str) -> str:\n    key = f\"{exp}:{user_id}\".encode()  # salt with exp name — independent splits per test\n    h = hashlib.md5(key).hexdigest()  # md5 is fine here — not security, just uniform hash\n    bucket = int(h[:8], 16) % 100  # first 32 bits → 0..99\n    return \"treatment\" if bucket < 50 else \"control\"  # deterministic: same user → same variant forever"
          }
        ]
      },
      {
        "heading": "Pick metrics before you peek",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Primary metric",
                "def": "The one number that decides ship/no-ship — pick it before the test starts."
              },
              {
                "term": "Guardrail metric",
                "def": "Things that must NOT regress (latency p99, error rate, revenue) even if the primary wins."
              },
              {
                "term": "MDE",
                "def": "Minimum detectable effect — the smallest lift you care about, which sets your sample size."
              },
              {
                "term": "p-value",
                "def": "Probability of seeing this lift if the variants were actually identical; small means surprising under the null."
              },
              {
                "term": "Power",
                "def": "Probability of catching a real lift of size MDE; aim for 0.8 or you'll miss real wins."
              }
            ]
          },
          {
            "type": "p",
            "text": "Sample size grows roughly as 1/MDE². Halving the effect you want to detect needs **4x the traffic**. This is why \"let's just run it for a day\" usually proves nothing."
          }
        ]
      },
      {
        "heading": "Pitfalls",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Discipline",
            "watchLabel": "Traps",
            "good": [
              "Lock primary metric and MDE before launch",
              "Assign on user_id, salted per experiment",
              "Run at least one full weekly cycle",
              "Pre-register guardrails (latency, error rate)"
            ],
            "watch": [
              "**Peeking**: stopping the moment p < 0.05 inflates false positives — fix sample size up front",
              "**Novelty effect**: users click anything new for a week, then revert — wait it out",
              "**Simpson's paradox**: treatment wins overall but loses in every segment — check splits",
              "**SRM** (sample ratio mismatch): 50/50 split came out 48/52? your splitter is broken, throw out the result"
            ]
          }
        ]
      },
      {
        "heading": "Reading the result",
        "body": [
          {
            "type": "code",
            "lang": "sql",
            "text": "-- one row per user, joined to their assignment\nWITH per_user AS (\n  SELECT a.variant,                                  -- control | treatment\n         u.user_id,\n         COUNT(e.event_id) AS clicks                 -- primary metric: clicks per user\n  FROM   assignments a\n  JOIN   users u USING (user_id)\n  LEFT   JOIN events e                               -- LEFT JOIN: users with 0 clicks must count\n         ON e.user_id = u.user_id\n        AND e.ts >= a.assigned_at                    -- only events AFTER assignment — no leakage\n  GROUP  BY 1, 2\n)\nSELECT variant,\n       AVG(clicks)            AS mean,               -- per-variant average\n       STDDEV(clicks)         AS sd,                 -- need this for the t-stat\n       COUNT(*)               AS n                   -- sanity-check for SRM\nFROM   per_user\nGROUP  BY variant;"
          },
          {
            "type": "p",
            "text": "Compute the lift as `(mean_t - mean_c) / mean_c`, then a two-sample t-test for significance. If the p-value clears your pre-set threshold AND no guardrail regresses AND the segments agree — ship it."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "quote",
            "text": "Offline metrics tell you the model learned. A/B tests tell you the users noticed.",
            "cite": "the only test that pays rent"
          },
          {
            "type": "p",
            "text": "Treat every model launch as a hypothesis, not a deployment. The discipline of **decide the metric, fix the sample size, don't peek** is what separates ML that compounds from ML that just churns."
          }
        ]
      }
    ]
  },
  "llm-fundamentals": {
    "sections": [
      {
        "heading": "What an LLM actually does",
        "body": [
          {
            "type": "p",
            "text": "An LLM is a **next-token predictor**. That's it. Give it a string, it returns a probability distribution over the next token, you sample one, append it, and repeat. Everything else — chat, reasoning, tool use — is scaffolding on top of that single primitive."
          },
          {
            "type": "p",
            "text": "The magic isn't the prediction. It's that at sufficient **scale**, learning to predict the next token forces the model to learn syntax, facts, style, and rudimentary reasoning as a side effect."
          }
        ]
      },
      {
        "heading": "The pipeline: text in, token out",
        "body": [
          {
            "type": "p",
            "text": "Every forward pass walks the same path. **Tokens** become vectors, vectors flow through stacked **transformer blocks**, the final vector projects back to a vocabulary-sized distribution. The loop runs once per output token."
          },
          {
            "type": "diagram",
            "title": "One forward pass through an LLM",
            "nodes": [
              {
                "id": "txt",
                "label": "Raw text",
                "subtitle": "\"The cat sat\"",
                "x": 0.06,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "tok",
                "label": "Tokenizer",
                "subtitle": "BPE → ids",
                "x": 0.24,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "emb",
                "label": "Embeddings",
                "subtitle": "ids → vectors",
                "x": 0.42,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "blk",
                "label": "Transformer × N",
                "subtitle": "attention + MLP",
                "x": 0.62,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "lgt",
                "label": "Logits",
                "subtitle": "vocab-sized vector",
                "x": 0.82,
                "y": 0.35,
                "accent": "earth"
              },
              {
                "id": "smp",
                "label": "Sampler",
                "subtitle": "pick next token",
                "x": 0.82,
                "y": 0.7,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "txt",
                "to": "tok",
                "kind": "dashed",
                "label": "string"
              },
              {
                "from": "tok",
                "to": "emb",
                "kind": "dashed",
                "label": "token ids"
              },
              {
                "from": "emb",
                "to": "blk",
                "kind": "dashed",
                "label": "vectors"
              },
              {
                "from": "blk",
                "to": "lgt",
                "kind": "solid",
                "label": "project"
              },
              {
                "from": "lgt",
                "to": "smp",
                "kind": "dashed",
                "label": "softmax"
              },
              {
                "from": "smp",
                "to": "tok",
                "kind": "arc",
                "label": "append + loop",
                "accent": "fire"
              }
            ]
          },
          {
            "type": "p",
            "text": "That arc back to the tokenizer is **autoregression** — the output becomes the next input. A 500-token response is 500 full forward passes."
          }
        ]
      },
      {
        "heading": "Inside the loop, in code",
        "body": [
          {
            "type": "p",
            "text": "Stripped of the framework noise, generation is a `while` loop around four operations. The shapes are what matter."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "ids = tokenizer.encode(\"The cat sat\")  # [1037, 4937, 2938] — subwords, not chars\nx = embedding[ids]  # shape (T, d_model) — one vector per token\n\nfor _ in range(max_new_tokens):  # one pass = one output token\n    h = transformer_blocks(x)  # self-attention sees all prior tokens\n    logits = h[-1] @ embedding.T  # only the LAST position predicts next\n    logits = logits / temperature  # flatten (>1) or sharpen (<1) the distribution\n    probs  = softmax(logits)  # turn raw scores into a valid PMF\n    next_id = sample(probs, top_p=0.9)  # nucleus sampling — see table below\n    if next_id == eos: break  # model decides when to stop\n    x = concat(x, embedding[next_id])  # O(T²) attention — KV cache fixes this"
          },
          {
            "type": "p",
            "text": "Notice the `h[-1]` — even though attention computes a vector for every position, you only **read the last one** during generation. The rest are wasted compute unless you cache them, which is exactly what the **KV cache** does."
          }
        ]
      },
      {
        "heading": "Sampling: how the next token gets picked",
        "body": [
          {
            "type": "p",
            "text": "Softmax gives you probabilities over ~50,000 tokens. How you collapse that distribution to one choice determines whether the model sounds robotic, creative, or deranged."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Greedy",
                "def": "Always pick the argmax. Deterministic, fast, and prone to repetitive loops — *\"the the the\"*."
              },
              {
                "term": "Temperature",
                "def": "Scales logits before softmax. **τ < 1** sharpens (more confident), **τ > 1** flattens (more chaotic), **τ = 0** ≡ greedy."
              },
              {
                "term": "Top-k",
                "def": "Keep only the **k** highest-probability tokens, renormalize, sample. Cuts the long tail of nonsense."
              },
              {
                "term": "Top-p (nucleus)",
                "def": "Keep the smallest set whose cumulative probability ≥ **p**. Adapts: narrow when model is confident, wide when it isn't."
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Strategy",
              "Good for",
              "Watch out for"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Greedy (τ=0) — deterministic",
                "Code, math, extraction",
                "Loops, dull prose"
              ],
              [
                "Temperature 0.7",
                "General chat, default",
                "Occasional drift"
              ],
              [
                "Temperature 1.2+",
                "Brainstorming, fiction",
                "Hallucinations, gibberish"
              ],
              [
                "Top-k = 40",
                "Bounded creativity",
                "k is a magic number"
              ],
              [
                "Top-p = 0.9",
                "Best general-purpose",
                "Still needs τ tuning"
              ]
            ]
          },
          {
            "type": "p",
            "text": "In practice you stack them: **temperature → top-p → sample**. Most production APIs default to roughly `τ=0.7, top_p=0.9`."
          }
        ]
      },
      {
        "heading": "Key insight — and what to watch for",
        "body": [
          {
            "type": "quote",
            "text": "The model has no memory between calls. Every \"conversation\" is the entire transcript, re-tokenized, re-embedded, re-attended — every single turn.",
            "cite": "the thing nobody tells you on day one"
          },
          {
            "type": "pros-cons",
            "goodLabel": "What this buys you",
            "watchLabel": "What this costs you",
            "good": [
              "Stateless inference — trivial to scale horizontally",
              "Full context visibility — prompt engineering actually works",
              "Reproducible at τ=0 given identical inputs"
            ],
            "watch": [
              "Cost scales with **total** transcript length, not just the new turn",
              "Latency is O(output_tokens) — long replies are slow no matter the hardware",
              "No genuine learning mid-conversation — only **in-context** pattern matching",
              "Context window is a hard wall; past it, old tokens get dropped or summarized"
            ]
          },
          {
            "type": "p",
            "text": "Once you internalize *next-token-predictor in a loop*, the rest of the stack — **RAG**, **fine-tuning**, **function calling**, **chain-of-thought** — stops feeling like magic and starts looking like obvious engineering around a very specific primitive."
          }
        ]
      }
    ]
  },
  "llm-prompting": {
    "sections": [
      {
        "heading": "Prompts are programs",
        "body": [
          {
            "type": "p",
            "text": "A prompt is **source code** for a non-deterministic interpreter. Same input, different output — but the structure you give it still dominates the result. Vague prompts produce vague answers; that's not the model being dumb, that's you underspecifying."
          },
          {
            "type": "p",
            "text": "The job of prompt engineering is to **constrain the output space** until the model has only one reasonable thing to say. Role, context, examples, format — each one narrows the cone."
          }
        ]
      },
      {
        "heading": "The four techniques you actually need",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Zero-shot",
                "def": "Just ask. Works when the task is common and the model has seen it a million times in training — classify sentiment, summarize, translate."
              },
              {
                "term": "Few-shot",
                "def": "Show 2-5 input/output examples before the real query. Use when the format is unusual or the task is fuzzy; the model pattern-matches your examples."
              },
              {
                "term": "Chain-of-thought (CoT)",
                "def": "Add 'think step by step' or show worked reasoning in examples. Trades tokens for accuracy on math, logic, and multi-hop questions."
              },
              {
                "term": "System prompt",
                "def": "Persistent instructions set out-of-band from the user turn. Defines role, tone, refusal rules, output format — survives the whole conversation."
              }
            ]
          }
        ]
      },
      {
        "heading": "Anatomy of a working prompt",
        "body": [
          {
            "type": "p",
            "text": "Here's a classifier prompt with every part doing one job. Strip any line and quality drops."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "You are a support-ticket router for a SaaS company.   # role — anchors vocabulary & tone\nClassify each ticket into exactly one of:  # task — single verb, bounded output\n  BILLING | BUG | FEATURE_REQUEST | OTHER  # enum — no free-form drift\n\nRules:  # constraints — block known failure modes\n- If unsure, choose OTHER. Never invent a category.    # forces calibrated uncertainty\n- Output JSON only, no prose.  # parseable downstream\n\nExamples:  # few-shot — teaches the format\nTicket: \"card declined again\"      -> {\"label\":\"BILLING\"}   # short input, exact output shape\nTicket: \"app crashes on export\"    -> {\"label\":\"BUG\"}  # second example disambiguates BUG vs OTHER\n\nTicket: \"{{user_message}}\"  # the actual variable — last, so it's freshest\n->"
          }
        ]
      },
      {
        "heading": "Where prompts go wrong",
        "body": [
          {
            "type": "table",
            "headers": [
              "Failure mode",
              "Symptom",
              "Fix"
            ],
            "rows": [
              [
                "Underspecified format",
                "Sometimes JSON, sometimes prose, sometimes markdown",
                "Show the exact output shape in an example"
              ],
              [
                "Conflicting instructions",
                "Model picks one rule and silently drops the other",
                "Read your prompt out loud; delete contradictions"
              ],
              [
                "Buried question",
                "Long context, real ask at the top — model forgets it",
                "Put the question last, right before the cursor"
              ],
              [
                "No escape hatch",
                "Model hallucinates rather than say 'I don't know'",
                "Add an explicit OTHER / null / refuse option"
              ],
              [
                "Negative-only rules",
                "'Don't be verbose' — model is still verbose",
                "Tell it what TO do: 'Reply in one sentence.'"
              ]
            ]
          }
        ]
      },
      {
        "heading": "How the pieces compose",
        "body": [
          {
            "type": "diagram",
            "nodes": [
              {
                "id": "sys",
                "label": "System prompt",
                "subtitle": "role, rules, format",
                "x": 0.15,
                "y": 0.25,
                "accent": "sky"
              },
              {
                "id": "shots",
                "label": "Few-shot examples",
                "subtitle": "teach the shape",
                "x": 0.15,
                "y": 0.75,
                "accent": "earth"
              },
              {
                "id": "ctx",
                "label": "Retrieved context",
                "subtitle": "facts, docs (RAG)",
                "x": 0.5,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "user",
                "label": "User turn",
                "subtitle": "the actual ask",
                "x": 0.85,
                "y": 0.25,
                "accent": "water"
              },
              {
                "id": "out",
                "label": "Model output",
                "subtitle": "constrained answer",
                "x": 0.85,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "sys",
                "to": "out",
                "kind": "solid",
                "label": "anchors"
              },
              {
                "from": "shots",
                "to": "out",
                "kind": "solid",
                "label": "shapes"
              },
              {
                "from": "ctx",
                "to": "out",
                "kind": "dashed",
                "label": "grounds"
              },
              {
                "from": "user",
                "to": "out",
                "kind": "dashed",
                "label": "asks"
              }
            ]
          },
          {
            "type": "p",
            "text": "System and few-shot are **structural** — they don't change between calls. Context and user turn are **dynamic** — they change every request. Cache the structural part; pay tokens only on the dynamic part."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Prompt drift across models.** A prompt tuned for one model version regresses on the next. Keep an eval set of 20-50 cases; re-run on every model bump.",
              "**Few-shot bias.** If all 4 examples have label `BUG`, the model will over-predict `BUG`. Balance your examples or shuffle them.",
              "**CoT in production.** Reasoning tokens cost money and latency. Use CoT to *discover* a prompt, then distill the final instruction into a zero-shot version once it works.",
              "**Trusting the model's confidence.** It will state wrong answers in the same tone as right ones. If correctness matters, ask for citations or a structured `confidence` field — and verify."
            ]
          },
          {
            "type": "quote",
            "text": "If you can't write the rubric, you can't write the prompt.",
            "cite": "anonymous, but true"
          }
        ]
      }
    ]
  },
  "llm-rag": {
    "sections": [
      {
        "heading": "The librarian with a long memory",
        "body": [
          {
            "type": "p",
            "text": "**An LLM is a brilliant intern who graduated last year.** It knows a lot, but nothing about your private wiki, last week's incident review, or the contract you signed yesterday. RAG is the trick where you hand it the relevant pages *before* you ask the question."
          },
          {
            "type": "p",
            "text": "Two phases, two clocks. **Index time** runs once (or on every doc change) — it's a batch job. **Query time** runs on every user request — it's a latency budget. Mixing them up is the single most common RAG mistake."
          }
        ]
      },
      {
        "heading": "Two phases, two clocks",
        "body": [
          {
            "type": "p",
            "text": "Index time is where you spend CPU you have. Query time is where you spend latency you don't. Draw them as two separate pipelines or you'll keep accidentally re-embedding the corpus on every request."
          },
          {
            "type": "diagram",
            "title": "Index time vs query time",
            "height": 320,
            "nodes": [
              {
                "id": "docs",
                "label": "Docs",
                "subtitle": "PDFs+wiki",
                "accent": "amber",
                "x": 0.1,
                "y": 0.22
              },
              {
                "id": "chunk",
                "label": "Chunker",
                "subtitle": "split + overlap",
                "accent": "sky",
                "x": 0.37,
                "y": 0.22
              },
              {
                "id": "embed",
                "label": "Embedder",
                "subtitle": "text → vector",
                "accent": "sky",
                "x": 0.64,
                "y": 0.22
              },
              {
                "id": "store",
                "label": "Vector DB",
                "subtitle": "qdrant",
                "accent": "fire",
                "x": 0.9,
                "y": 0.22
              },
              {
                "id": "user",
                "label": "User",
                "subtitle": "question",
                "accent": "water",
                "x": 0.1,
                "y": 0.78
              },
              {
                "id": "qemb",
                "label": "Embed q",
                "subtitle": "same model",
                "accent": "sky",
                "x": 0.37,
                "y": 0.78
              },
              {
                "id": "search",
                "label": "Retrieve",
                "subtitle": "top-k · rerank",
                "accent": "earth",
                "x": 0.64,
                "y": 0.78
              },
              {
                "id": "llm",
                "label": "LLM",
                "subtitle": "answer + cite",
                "accent": "sky",
                "x": 0.9,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "docs",
                "to": "chunk",
                "kind": "dashed",
                "accent": "amber",
                "label": "once per doc"
              },
              {
                "from": "chunk",
                "to": "embed",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "embed",
                "to": "store",
                "kind": "solid",
                "accent": "fire",
                "label": "write"
              },
              {
                "from": "user",
                "to": "qemb",
                "kind": "dashed",
                "accent": "water",
                "label": "per request"
              },
              {
                "from": "qemb",
                "to": "search",
                "kind": "dashed",
                "accent": "earth"
              },
              {
                "from": "search",
                "to": "llm",
                "kind": "dashed",
                "accent": "sky",
                "label": "context"
              }
            ]
          },
          {
            "type": "p",
            "text": "The **embedder must be the same model** in both rows. Swap it on one side without re-indexing and every query returns garbage with high confidence."
          }
        ]
      },
      {
        "heading": "Retrieval strategies",
        "body": [
          {
            "type": "p",
            "text": "\"Vector search\" is one tool, not the toolbox. Real systems combine modes because each fails differently."
          },
          {
            "type": "table",
            "headers": [
              "Strategy",
              "Catches",
              "When to reach for it"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "**Dense (vector)**",
                "Paraphrase, synonyms, multilingual",
                "Default for unstructured prose — misses exact IDs + typos"
              ],
              [
                "**Sparse (BM25)**",
                "Exact tokens, codes, names",
                "Logs, code, product SKUs — misses reworded queries"
              ],
              [
                "**Hybrid (RRF)**",
                "Both of the above",
                "Almost every production system (1 fusion hop)"
              ],
              [
                "**Rerank (cross-encoder)**",
                "Subtle relevance over top-25",
                "Recall@25 is fine but top-5 is noisy (100-300ms latency tax)"
              ],
              [
                "**Metadata filter**",
                "Recency, tenant, ACL",
                "Multi-tenant or time-sensitive corpora — pre-filter, misses nothing"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Hybrid + rerank** is the boring answer that wins benchmarks. Start there; only simplify once you measure that one mode is enough."
          }
        ]
      },
      {
        "heading": "The query path, annotated",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "def answer(question: str, tenant_id: str) -> str:\n    q_vec = embedder.embed(question)  # SAME model as index time\n    dense = vdb.search(q_vec, k=25,  # over-fetch — rerank trims\n                       filter={'tenant': tenant_id}) # ACL as pre-filter, never post\n    sparse = bm25.search(question, k=25)  # catches IDs / exact tokens\n    fused = reciprocal_rank_fusion(dense, sparse)   # merge by rank, not score\n    top = reranker.score(question, fused)[:5]  # cross-encoder, ~150ms\n    ctx = '\\n---\\n'.join(c.text for c in top[::-1]) # best chunk LAST — lost-in-middle\n    return llm.complete(PROMPT.format(ctx=ctx,  # prompt forces citations\n                                       q=question))"
          },
          {
            "type": "p",
            "text": "The reversal on the second-to-last line is not a bug. Long-context LLMs attend more to the **start and end** of their input — your best chunk goes where the model is actually looking."
          }
        ]
      },
      {
        "heading": "Chunking is the whole game",
        "body": [
          {
            "type": "p",
            "text": "Chunk too small and you retrieve a sentence with no context. Chunk too large and you retrieve a chapter where the answer is buried in noise. There is no universal right size — there is a right size **for your docs and your model**."
          },
          {
            "type": "pros-cons",
            "goodLabel": "WHAT WORKS",
            "watchLabel": "GOTCHAS",
            "good": [
              "Start at 500 tokens with 50-token overlap, then measure",
              "Split on **semantic boundaries** (headers, paragraphs) before tokens",
              "Keep **document title + section** in every chunk's prefix",
              "Store the parent doc ID so you can expand context on demand"
            ],
            "watch": [
              "Fixed-size splits cut tables and code blocks in half",
              "Zero overlap loses the answer that straddles the boundary",
              "Markdown tables embedded as prose embed *terribly* — extract them",
              "PDFs with two columns become interleaved gibberish — use a layout parser"
            ]
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Recall@k",
                "def": "Fraction of queries where the right chunk appears anywhere in the top-k retrieved. Tune chunking and retrieval to maximize this — the LLM can't cite what you never fetched."
              },
              {
                "term": "Reciprocal rank fusion",
                "def": "Combine two ranked lists by summing 1/(k+rank). Score-free, so dense and sparse scores never need calibrating against each other."
              },
              {
                "term": "Lost in the middle",
                "def": "Empirical finding that LLMs use information at the start and end of long contexts more reliably than the middle. Order your retrieved chunks accordingly."
              },
              {
                "term": "Embedding drift",
                "def": "When you upgrade the embedder, every old vector in the index is now in the wrong space. Treat embedder version as part of the index schema."
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "quote",
            "text": "RAG fails silently. It returns confident wrong answers from confidently wrong chunks.",
            "cite": "every team who skipped eval"
          },
          {
            "type": "ul",
            "items": [
              "**No eval set, no progress.** Build 50 (question, ground-truth chunk_id) pairs before you tune anything. Without it, every change is vibes.",
              "**Embedder ≠ generator.** The model that embeds is not the model that answers. Pick each one separately.",
              "**Re-embed on model swap.** New embedder = full reindex. Budget the cost; don't discover it in prod.",
              "**ACL at retrieve time, not generate time.** Filtering in the prompt is a leak waiting to happen — push tenant/permission into the vector query."
            ]
          },
          {
            "type": "p",
            "text": "**Key insight:** RAG is a *retrieval* problem with an LLM stapled on the end. If your retrieval recall@5 is 0.4, no amount of prompt engineering saves you — you're asking the model to cite documents it never saw."
          }
        ]
      }
    ]
  },
  "ml-inference-api": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Wrap a trained **scikit-learn** model behind a **FastAPI** service that validates input with **pydantic**, returns predictions in under a fixed latency budget, and exposes a `/health` endpoint that tells your orchestrator whether to send traffic. This is the smallest unit of production ML — every recommendation, fraud check, and churn score in your career will start out looking like this."
          },
          {
            "type": "p",
            "text": "The point isn't the model. It's the **contract**: a typed request in, a typed prediction out, a p99 you can defend, and a health probe Kubernetes can trust. Get this shape right and swapping sklearn for XGBoost or a torch model is a one-file change."
          },
          {
            "type": "diagram",
            "title": "Request lifecycle",
            "height": 210,
            "nodes": [
              {
                "id": "client",
                "label": "Client",
                "subtitle": "curl · service",
                "accent": "water",
                "x": 0.08,
                "y": 0.5
              },
              {
                "id": "api",
                "label": "FastAPI",
                "subtitle": "uvicorn · :8000",
                "accent": "sky",
                "x": 0.4,
                "y": 0.5
              },
              {
                "id": "model",
                "label": "Model",
                "subtitle": "sklearn · pickled",
                "accent": "earth",
                "x": 0.72,
                "y": 0.28
              },
              {
                "id": "probe",
                "label": "/health",
                "subtitle": "k8s probe",
                "accent": "amber",
                "x": 0.72,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "api",
                "kind": "dashed",
                "label": "POST /predict"
              },
              {
                "from": "api",
                "to": "model",
                "kind": "dashed",
                "accent": "earth",
                "label": "in-process call",
                "curve": 0.3
              },
              {
                "from": "api",
                "to": "probe",
                "kind": "solid",
                "accent": "amber",
                "label": "liveness",
                "curve": 0.3
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**A `/predict` endpoint** that accepts a JSON feature vector, runs `model.predict_proba`, returns label + score.",
              "**Pydantic request/response models** with field types, ranges, and an `extra='forbid'` policy so junk fields 422 instead of silently being ignored.",
              "**A `/health` endpoint** that returns 200 only after the model is loaded and warm — Kubernetes uses this to gate traffic.",
              "**A latency budget** (target: p99 < 50ms on a laptop CPU) measured with a tiny `time.perf_counter` middleware that logs per-request ms.",
              "**A `/metrics` line-count or Prometheus scrape** exposing request count, error count, and a latency histogram.",
              "**A `Dockerfile`** that builds an image under 300 MB with the model baked in or mounted at startup."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Python 3.11+** with `fastapi`, `uvicorn[standard]`, `pydantic>=2`, `scikit-learn`, `joblib`, `numpy`.",
              "A **trained sklearn model** pickled with `joblib.dump(model, 'model.joblib')` — any classifier works (LogReg on iris is fine).",
              "**`curl`** and **`hey`** (or `wrk`/`vegeta`) for hand-testing and load-testing the latency budget.",
              "**Docker 24+** for the final container build step.",
              "Free port **`8000`** on the host."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Train and serialize** a sklearn classifier once (`fit` on iris or your own data), then `joblib.dump` it to `model.joblib`.",
              "**Define the pydantic schema** for `PredictRequest` and `PredictResponse` — name every feature, set bounds with `Field(ge=, le=)`, forbid extras.",
              "**Load the model once at startup** using FastAPI's `lifespan` context — never reload per-request, that's how you blow your p99.",
              "**Implement `/predict`** to validate, call `model.predict_proba`, and return the response model; wrap the call in a try/except that maps sklearn errors to HTTP 500.",
              "**Implement `/health`** that returns `{\"status\":\"ok\"}` only when the global model handle is non-None — fail fast if startup failed.",
              "**Add a latency middleware** that records `perf_counter` deltas and logs anything over the budget so you can see regressions in CI.",
              "**Load-test with `hey -z 30s -c 16 http://localhost:8000/predict`**, confirm p99 sits under your budget, then tune workers or batch if it doesn't.",
              "**Containerize** with a slim Python base image; copy `model.joblib` in, set `CMD [\"uvicorn\", \"app:app\", \"--host\", \"0.0.0.0\"]`."
            ]
          }
        ]
      },
      {
        "heading": "The service",
        "body": [
          {
            "type": "p",
            "text": "The whole thing fits on one screen. Read it in order — **schema first** so junk requests get 422 before they reach the model:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import time, joblib, numpy as np  # joblib loads sklearn pickles safely\nfrom contextlib import asynccontextmanager  # lifespan = startup/shutdown hook\nfrom fastapi import FastAPI, HTTPException, Request\nfrom pydantic import BaseModel, Field, ConfigDict\n\nclass PredictRequest(BaseModel):\n    model_config = ConfigDict(extra='forbid')    # junk fields → 422, not silent drop\n    sepal_length: float = Field(ge=0, le=10)  # bounds catch upstream data bugs\n    sepal_width:  float = Field(ge=0, le=10)\n    petal_length: float = Field(ge=0, le=10)\n    petal_width:  float = Field(ge=0, le=10)\n\nclass PredictResponse(BaseModel):\n    label: int  # integer class id\n    score: float = Field(ge=0, le=1)  # calibrated probability"
          },
          {
            "type": "p",
            "text": "**Lifespan loads the model exactly once** — never in a request handler. The middleware enforces a p99 budget and stamps each response with its latency."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "state = {}  # holds the loaded model handle\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    state['model'] = joblib.load('model.joblib') # load ONCE — not per request\n    yield  # app serves traffic here\n    state.clear()  # release on shutdown\n\napp = FastAPI(lifespan=lifespan)\nBUDGET_MS = 50  # p99 latency budget we defend\n\n@app.middleware('http')\nasync def timing(request: Request, call_next):\n    t0 = time.perf_counter()  # monotonic clock — never goes backwards\n    resp = await call_next(request)\n    dt = (time.perf_counter() - t0) * 1000\n    resp.headers['x-latency-ms'] = f'{dt:.1f}'   # visible in curl -i for debugging\n    if dt > BUDGET_MS:\n        print(f'SLOW {request.url.path} {dt:.1f}ms')  # ship to logs/metrics\n    return resp"
          },
          {
            "type": "p",
            "text": "**The routes** — `/health` returns 503 until the model is loaded so traffic never lands on a half-started container; `/predict` shapes the input, runs inference, and wraps any sklearn explosion as a 500."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "@app.get('/health')\ndef health():\n    if 'model' not in state:  # startup failed → 503 → no traffic\n        raise HTTPException(503, 'model not loaded')\n    return {'status': 'ok'}\n\n@app.post('/predict', response_model=PredictResponse)\ndef predict(req: PredictRequest):\n    x = np.array([[req.sepal_length, req.sepal_width,\n                   req.petal_length, req.petal_width]])  # 2D shape sklearn expects\n    try:\n        probs = state['model'].predict_proba(x)[0]  # single-row batch\n    except Exception as e:  # turn any sklearn boom into 500\n        raise HTTPException(500, f'inference failed: {e}')\n    label = int(np.argmax(probs))\n    return PredictResponse(label=label, score=float(probs[label]))\n"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "**`curl localhost:8000/health`** returns `200` only after the model has loaded — restarting with a missing `model.joblib` gives `503`, not a confusing crash.",
              "**A malformed `/predict` body** (extra field, string where float expected, value out of range) returns **`422`** with a clear error path, not a 500.",
              "**`hey -z 30s -c 16` against `/predict`** shows **p99 latency under your 50 ms budget** on a laptop CPU.",
              "**The model loads exactly once** — log line `model loaded` appears in startup, never in request handlers.",
              "**`x-latency-ms` header** appears on every response and matches your server-side log within ~1 ms.",
              "**The Docker image is under 300 MB** (`docker images`) and the container starts and passes `/health` within 5 seconds."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "Same shape works for sklearn, xgboost, or torch — swap the loader only",
              "Pydantic v2 validation is fast enough to live on the hot path",
              "FastAPI auto-generates an OpenAPI page at `/docs` for free debugging"
            ],
            "watch": [
              "Loading the model **inside the handler** kills your p99 the moment cold caches drop — always use `lifespan`",
              "`predict_proba` allocates per call; using `numpy` lists instead of arrays silently doubles latency",
              "`/health` that always returns 200 is worse than no probe — Kubernetes will keep sending traffic to a broken pod"
            ]
          }
        ]
      }
    ]
  },
  "drift-detector": {
    "cliffhanger": "What signal tells you the drift is bad enough to retrain — versus drift that is just normal seasonality?",
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **background job** that wakes up every few minutes, pulls a fresh window of production feature vectors from your inference logs, and compares each feature's distribution against the **training reference** snapshot. When the distance crosses a threshold, it fires an alert — because a model trained on yesterday's traffic is silently wrong on today's."
          },
          {
            "type": "p",
            "text": "The two workhorse statistics are **PSI** (Population Stability Index) for binned distributions and the **KS test** for continuous ones. Both are cheap, interpretable, and the industry default for tabular drift. The hard part isn't the math — it's the **plumbing**: stable bin edges, dealing with empty windows, not paging on-call at 3am for a 0.11 PSI on a feature nobody uses."
          },
          {
            "type": "diagram",
            "title": "Drift detector flow",
            "nodes": [
              {
                "id": "logs",
                "label": "Inference Logs",
                "subtitle": "live features",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "ref",
                "label": "Reference Snapshot",
                "subtitle": "training stats",
                "x": 0.5,
                "y": 0.12,
                "accent": "earth"
              },
              {
                "id": "job",
                "label": "Drift Job",
                "subtitle": "PSI + KS",
                "x": 0.5,
                "y": 0.55,
                "accent": "sky"
              },
              {
                "id": "store",
                "label": "Metrics Store",
                "subtitle": "psi over time",
                "x": 0.88,
                "y": 0.3,
                "accent": "fire"
              },
              {
                "id": "alert",
                "label": "Alert Sink",
                "subtitle": "Slack / PagerDuty",
                "x": 0.88,
                "y": 0.78,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "logs",
                "to": "job",
                "kind": "dashed",
                "label": "window pull"
              },
              {
                "from": "ref",
                "to": "job",
                "kind": "solid",
                "label": "loads once"
              },
              {
                "from": "job",
                "to": "store",
                "kind": "dashed",
                "label": "psi, ks"
              },
              {
                "from": "job",
                "to": "alert",
                "kind": "dashed",
                "label": "threshold breach"
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Reference builder** — a one-shot script that reads your training CSV/Parquet and writes `reference.json` with per-feature bin edges, counts, mean, and std.",
              "**Drift worker** — a long-running Python process (or cron-triggered container) that pulls the last N minutes of inference logs and computes PSI per feature.",
              "**KS test path** — for features flagged as continuous, run `scipy.stats.ks_2samp` against a sampled reference vector; record both statistic and p-value.",
              "**Threshold config** — a YAML file mapping feature → (psi_warn, psi_alert) and a global `min_samples` so tiny windows don't trip alerts.",
              "**Alert dispatch** — a thin webhook poster (Slack incoming webhook is fine) with a 15-minute dedup window per feature so one drifting feature doesn't spam the channel.",
              "**Metrics export** — Prometheus `/metrics` endpoint exposing `drift_psi{feature=\"...\"}` so you can graph drift over weeks in Grafana."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Python 3.11+** with `numpy`, `pandas`, `scipy`, `pyyaml`, `prometheus-client`, and `requests` installed in a venv.",
              "**A training dataset** you trust — even a toy one. The Adult Income or California Housing CSVs from sklearn work; you need at least 10k rows.",
              "**An inference log source** — for this lab a JSONL file the worker tails is fine; production swaps in Kafka or a Postgres `inference_log` table.",
              "**Docker + docker compose** to run the worker, a Prometheus scrape target, and a Grafana dashboard locally.",
              "**A Slack incoming webhook URL** (free workspace works) or any HTTP endpoint that accepts a POST — `webhook.site` is fine for testing.",
              "**Familiarity with PSI/KS** at the level of: \"PSI > 0.25 means the distribution materially shifted.\" You don't need to derive it from scratch."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Snapshot the training reference.** Load your training set, compute 10 quantile-based bin edges per numeric feature, store category counts for categoricals, and persist to `reference.json`. **Freeze the bin edges here** — recomputing them at drift time defeats the whole point.",
              "**Generate fake live traffic.** Write a `simulate.py` that appends rows to `inference_log.jsonl` — start by sampling from the training distribution, then introduce a deliberate shift (multiply one feature by 1.5, swap a category's frequency) so you have something to detect.",
              "**Implement PSI.** For each feature, bucket the live window using the **reference's** bin edges, compute `Σ (live_pct - ref_pct) · ln(live_pct / ref_pct)`. Clip zero buckets to a tiny epsilon so `ln(0)` doesn't explode.",
              "**Wire the KS test.** For continuous features, draw a 5k-sample reference vector once at startup, run `ks_2samp(reference_sample, live_window)`, and record the statistic alongside PSI.",
              "**Add the scheduler.** Loop every 5 minutes: pull the last 10 minutes of logs, check `min_samples`, compute drift, write metrics, and dispatch alerts for features above their `psi_alert` threshold.",
              "**Stand up Prometheus + Grafana** via `docker compose`. Scrape the worker's `/metrics` endpoint and build a single dashboard panel: `drift_psi` per feature over time, with horizontal lines at 0.1 (warn) and 0.25 (alert).",
              "**Test the alert path end-to-end.** Run `simulate.py --shift age` and watch the PSI for `age` climb across two scrape intervals, then verify the Slack webhook fires exactly once (not on every tick — dedup is doing its job).",
              "**Document the runbook.** Write `RUNBOOK.md` answering: who gets paged, how to silence a noisy feature, when to retrain vs. just acknowledge the drift."
            ]
          }
        ]
      },
      {
        "heading": "The PSI core",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np\nfrom scipy.stats import ks_2samp\n\nEPS = 1e-6  # avoid ln(0) blow-up\n\ndef psi(ref_counts, live_values, edges):\n    live_counts, _ = np.histogram(live_values, bins=edges)   # reuse ref bins\n    ref_pct  = ref_counts  / max(ref_counts.sum(),  1)  # normalize to fractions\n    live_pct = live_counts / max(live_counts.sum(), 1)  # same for live window\n    ref_pct  = np.clip(ref_pct,  EPS, None)  # floor zero buckets\n    live_pct = np.clip(live_pct, EPS, None)  # symmetric clipping\n    return float(np.sum((live_pct - ref_pct) * np.log(live_pct / ref_pct)))\n\ndef check_feature(name, ref, live, cfg):\n    if len(live) < cfg[\"min_samples\"]:  # skip thin windows\n        return None  # no alert, no metric\n    score = psi(np.array(ref[\"counts\"]), live, np.array(ref[\"edges\"]))\n    ks_stat, ks_p = ks_2samp(ref[\"sample\"], live)  # continuous sanity check\n    level = \"alert\" if score >= cfg[\"psi_alert\"] else \\\n            \"warn\"  if score >= cfg[\"psi_warn\"]  else \"ok\"   # tiered severity\n    return {\"feature\": name, \"psi\": score, \"ks\": ks_stat,\n            \"ks_p\": ks_p, \"level\": level}  # emitted to metrics + alerter"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "Running `python build_reference.py` on the training CSV produces a `reference.json` under 200 KB with edges, counts, and a sample per feature.",
              "With `simulate.py` running clean (no shift), every feature's PSI stays under **0.1** for at least 30 minutes — no false positives.",
              "Triggering `simulate.py --shift age --factor 1.5` makes `drift_psi{feature=\"age\"}` cross **0.25** within two scrape intervals (10 minutes).",
              "Slack receives exactly **one** alert per drifting feature per 15-minute window, even though the worker ticks every 5 minutes.",
              "Grafana shows a clear per-feature time series with the 0.1 and 0.25 threshold lines drawn, and you can point at the moment drift started.",
              "Killing and restarting the worker (`docker compose restart drift`) resumes with the same reference and no duplicate alerts for already-firing features."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "PSI is **dimensionless and interpretable** — 0.1 / 0.25 thresholds are an industry convention you can defend in a review.",
              "The reference snapshot is **tiny and immutable**, so the worker is stateless and trivially horizontal-scalable per feature group.",
              "Drift detection is **decoupled from inference** — your serving p99 doesn't budge when the job runs, and a crashed worker can't take prediction down."
            ],
            "watch": [
              "**Recomputing bin edges** from the live window silently masks drift — the histograms always look balanced. Freeze edges at reference time.",
              "**Empty or tiny windows** produce wild PSI values from a handful of samples. Enforce `min_samples ≥ 1000` per feature or you'll page on noise.",
              "**Concept drift ≠ data drift.** PSI catches input shifts; it won't tell you the label relationship changed. Pair this with a delayed accuracy monitor."
            ]
          }
        ]
      }
    ]
  },
  "fastapi-ml-service": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Take any pretrained model (HuggingFace, sklearn, or a tiny custom one) and wrap it in a production-grade FastAPI service. Pydantic validation, async endpoints, request batching for throughput, /metrics for Prometheus, structured logging, and a Docker image under 500MB."
          }
        ]
      }
    ]
  },
  "ml-platform": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **tiny lakehouse-like ML platform** end-to-end: a scheduled training job pushes a model artifact to a registry, an inference service pulls the *current production* version, and a metrics sidecar tracks request latency and prediction drift. This is the **smallest stack that resembles production** — everything bigger is just more replicas, more isolation, and more YAML."
          },
          {
            "type": "p",
            "text": "The point isn't the libraries — it's the **contract between components**. Training doesn't know who serves. Serving doesn't know who trains. They communicate through the **registry as a versioned source of truth**, exactly like a database is the truth between web servers."
          },
          {
            "type": "diagram",
            "title": "Platform topology",
            "nodes": [
              {
                "id": "user",
                "label": "Client",
                "subtitle": "POST /predict",
                "x": 0.05,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "api",
                "label": "Inference API",
                "subtitle": "FastAPI",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "reg",
                "label": "MLflow Registry",
                "subtitle": "models + stages",
                "x": 0.62,
                "y": 0.25,
                "accent": "earth"
              },
              {
                "id": "train",
                "label": "Prefect Flow",
                "subtitle": "nightly train",
                "x": 0.62,
                "y": 0.78,
                "accent": "amber"
              },
              {
                "id": "mon",
                "label": "Prometheus",
                "subtitle": "latency + drift",
                "x": 0.92,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "user",
                "to": "api",
                "kind": "dashed",
                "label": "predict",
                "accent": "water"
              },
              {
                "from": "api",
                "to": "reg",
                "kind": "dashed",
                "label": "load",
                "accent": "earth"
              },
              {
                "from": "train",
                "to": "reg",
                "kind": "dashed",
                "label": "register",
                "accent": "amber"
              },
              {
                "from": "api",
                "to": "mon",
                "kind": "solid",
                "label": "metrics",
                "accent": "fire"
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Training flow** — a Prefect (or Airflow) DAG that loads a dataset, trains a scikit-learn model, logs params/metrics to MLflow, and registers the artifact with a version number.",
              "**Model registry** — a self-hosted **MLflow tracking server** backed by Postgres + S3-compatible storage (MinIO) holding every run and a `Production` alias pointer.",
              "**Inference service** — a FastAPI app that resolves `models:/iris@Production` at startup, holds the model in memory, and serves `/predict` with input validation via Pydantic.",
              "**Metrics + drift sidecar** — `/metrics` Prometheus endpoint exposing request latency histograms plus a rolling input-feature mean for drift detection.",
              "**Compose orchestration** — one `docker-compose.yml` brings up MinIO, Postgres, MLflow, the API, and Prometheus with healthchecks and a shared network.",
              "**Promotion script** — a tiny CLI that promotes a run to `Production`, triggering the API to hot-reload on its next health tick."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Docker + Compose v2** — everything runs as containers; no Python on the host required beyond the client.",
              "**Python 3.11** locally for the Prefect agent and the promotion CLI (the rest lives in containers).",
              "**~4 GB free RAM and 5 GB disk** — MinIO, Postgres, and Prometheus together are chunky.",
              "**Basic familiarity with FastAPI and scikit-learn** — you should be able to read a `pipeline.fit(X, y)` and not blink.",
              "**An HTTP client** — `curl`, **HTTPie**, or **Bruno** for hitting `/predict` and `/metrics` during smoke tests."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Bring up storage + registry.** Write `docker-compose.yml` with MinIO, Postgres, and MLflow server pointing at both. Verify the MLflow UI loads at `:5000` and shows zero experiments.",
              "**Author the training flow.** In `flows/train.py`, define a Prefect flow that loads `sklearn.datasets.load_iris`, trains a `LogisticRegression` pipeline, and calls `mlflow.sklearn.log_model(..., registered_model_name='iris')`.",
              "**Run the flow once manually.** Execute `python flows/train.py` and confirm a run appears in MLflow with metrics, params, and a v1 model artifact stored in MinIO (check the `mlflow/` bucket).",
              "**Build the inference service.** In `serve/app.py`, load `models:/iris@Production` at startup, expose `POST /predict` accepting four floats, and return the predicted class plus probability.",
              "**Wire in metrics.** Add `prometheus-fastapi-instrumentator` for latency, then add a custom `Gauge` for the rolling mean of `sepal_length` over the last 1000 requests — that's your **drift signal**.",
              "**Add Prometheus.** Drop a `prometheus.yml` that scrapes `inference:8000/metrics` every 15s; bring it up in the same compose and confirm targets are `UP`.",
              "**Promote and reload.** Write `scripts/promote.py` that sets the `Production` alias to the latest run; restart the API container and verify it now serves v1 instead of failing on cold start.",
              "**Smoke test the loop.** Run the flow again to produce v2, promote it, hit `/predict` 100 times, and confirm Prometheus shows the new version's latency histogram appearing."
            ]
          }
        ]
      },
      {
        "heading": "Inference service — the heart of it",
        "body": [
          {
            "type": "p",
            "text": "**Setup, load, instrument** — load the model through an alias (not a version) so promotions don't need a redeploy, and wire Prometheus before any request lands."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import os, mlflow, numpy as np  # mlflow client + numpy for input shaping\nfrom fastapi import FastAPI  # ASGI framework\nfrom pydantic import BaseModel, Field  # request schema validation\nfrom prometheus_fastapi_instrumentator import Instrumentator   # auto latency histogram\nfrom prometheus_client import Gauge  # custom drift metric\n\nmlflow.set_tracking_uri(os.environ['MLFLOW_URI'])  # points at mlflow container\nMODEL_URI = 'models:/iris@Production'  # alias, not version — survives promotions\n\napp = FastAPI()\nmodel = mlflow.pyfunc.load_model(MODEL_URI)  # eager load at startup, fail fast\nInstrumentator().instrument(app).expose(app)  # adds /metrics endpoint\n\nsepal_mean = Gauge('input_sepal_length_mean', 'rolling mean')  # drift proxy — alert on big shifts\n_window: list[float] = []  # cheap rolling buffer"
          },
          {
            "type": "p",
            "text": "**Schema + `/predict`** — bounds on every feature reject garbage at the door; the gauge update is a poor-man's drift detector."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "class Features(BaseModel):  # pydantic rejects bad shapes early\n    sepal_length: float = Field(ge=0, le=10)  # bounds catch garbage payloads\n    sepal_width:  float = Field(ge=0, le=10)\n    petal_length: float = Field(ge=0, le=10)\n    petal_width:  float = Field(ge=0, le=10)\n\n@app.post('/predict')\ndef predict(f: Features):\n    x = np.array([[f.sepal_length, f.sepal_width,  # order MUST match training columns\n                   f.petal_length, f.petal_width]])\n    pred = int(model.predict(x)[0])  # pyfunc returns ndarray\n    _window.append(f.sepal_length)  # track input distribution\n    if len(_window) > 1000: _window.pop(0)  # bounded memory, sliding window\n    sepal_mean.set(sum(_window)/len(_window))  # Prometheus scrapes this gauge\n    return {'class': pred, 'model_uri': MODEL_URI}  # echo URI for debugging promotions"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "`docker compose up` brings the whole stack to healthy with **no manual setup** beyond creating the MinIO bucket.",
              "Running the training flow **twice** produces v1 and v2 in MLflow, both with stored artifacts and metrics.",
              "`scripts/promote.py v2` followed by an API restart causes `/predict` responses to include `model_uri` resolving to v2.",
              "Prometheus shows `http_request_duration_seconds` histograms with **p99 under 50ms** for `/predict` at 100 RPS on your laptop.",
              "Sending a malformed JSON body returns **HTTP 422**, not 500 — Pydantic caught it before it reached the model.",
              "`docker compose down && docker compose up` preserves all runs and the `Production` alias (Postgres + MinIO volumes survived)."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "**Aliases beat stages** — `@Production` is mutable; promotion is one API call with zero code changes.",
              "**Compose volumes are your friend** — restart the API freely; MLflow state lives in Postgres + MinIO.",
              "**Pydantic at the door** kills 90% of inference bugs before they reach numpy."
            ],
            "watch": [
              "**Column order drift** — train uses a DataFrame, serve uses a list; one transposed column = silent garbage predictions.",
              "**Cold-start failures** — if no `Production` alias exists yet, the API crash-loops. Add a fallback to `latest` for dev.",
              "**MinIO endpoint mismatch** — MLflow inside Docker resolves `minio:9000`, but your host browser needs `localhost:9000`. Two env vars, not one."
            ]
          }
        ]
      }
    ]
  },
  "m1": {
    "sections": [
      {
        "heading": "The two-paragraph elevator pitch",
        "body": [
          {
            "type": "p",
            "text": "Traditional software is **deterministic**: same input, same output, forever. Your `add(2, 3)` returns `5` in 2019, 2026, and 2099. CI catches regressions because *correct* is a fixed target. DevOps grew up assuming this — deploy the artifact, run the tests, ship the bits."
          },
          {
            "type": "p",
            "text": "ML is **data-dependent** and the world moves. A fraud model trained on 2024 transactions degrades silently as fraudsters change tactics. The artifact is identical; the *environment around it* shifted. **MLOps exists because the bug is not in the code — it's in the relationship between the code and reality.**"
          },
          {
            "type": "quote",
            "text": "In software, the artifact rots when you change it. In ML, the artifact rots when you don't.",
            "cite": "the whole reason this discipline exists"
          }
        ]
      },
      {
        "heading": "Three failure modes DevOps never had to name",
        "body": [
          {
            "type": "p",
            "text": "Software has bugs, outages, and regressions. ML adds **three new categories** — none of which a green CI pipeline will catch. Memorize these terms; they're the vocabulary of every postmortem you'll write."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Data drift",
                "def": "the **input distribution** shifts. Users start uploading 4K phone pics; your model trained on 480p webcam frames. Code unchanged, accuracy tanks. Detect via feature-distribution monitors (KS test, PSI)."
              },
              {
                "term": "Concept drift",
                "def": "the **input→output relationship** shifts. Same features, but the *meaning* changed. Pre-2020 'works from home' predicted unemployment; post-2020 it predicts a salary bump. Detect via rolling label-vs-prediction error."
              },
              {
                "term": "Training/serving skew",
                "def": "your **offline pipeline ≠ online pipeline**. Training used pandas `mean()` on the full batch; serving uses a streaming approximation. Features look identical, math isn't. Detect by logging serving features and replaying through training code."
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# minimal drift check you can ship Monday\nfrom scipy.stats import ks_2samp  # two-sample KS test\n\ndef drifted(train_feat, live_feat, α=0.01):  # α = significance threshold\n    stat, p = ks_2samp(train_feat, live_feat)  # compare distributions\n    return p < α  # reject H0 → drift detected\n\nfor col in MONITORED:  # only numeric features\n    if drifted(train_df[col], live_df[col]):  # check each in isolation\n        alert(f\"drift: {col}\")  # page on-call, not Slack\n"
          }
        ]
      },
      {
        "heading": "Where DevOps skills translate (and where they don't)",
        "body": [
          {
            "type": "p",
            "text": "Good news: roughly **60% of your DevOps muscle memory ports directly**. Bad news: the 40% that doesn't is exactly where ML systems fail."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Translates cleanly",
            "watchLabel": "Doesn't translate — relearn it",
            "good": [
              "**Containerization** — a model is just a binary; Dockerfile it like any service.",
              "**CI/CD pipelines** — replace `pytest` with model-eval gates, keep the rest.",
              "**Observability stack** — Prometheus/Grafana still works; you just emit different metrics.",
              "**IaC (Terraform, Helm)** — GPU node pools are still node pools.",
              "**Blue/green & canary deploys** — shift 5% traffic to model v2, same playbook."
            ],
            "watch": [
              "**'Passing tests' ≠ correct** — your model can score 0.99 on holdout and fail in prod because holdout ≠ live distribution.",
              "**Versioning** — code-only Git is insufficient; you must version `code + data + model + features` as one unit (DVC, MLflow).",
              "**Reproducibility** — `pip install -r requirements.txt` doesn't reproduce a model; you need the exact training data snapshot too.",
              "**Rollback** — reverting code is instant; reverting a *model* may require retraining if the old weights are gone.",
              "**SLOs** — latency/uptime still apply, but you need new ones: **prediction-quality SLO**, **drift-budget**, **staleness SLO**."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "The trap is treating MLOps as **DevOps + a model.pkl in S3**. That gets you to demo. It does not get you to a system that's still accurate six months after launch."
          },
          {
            "type": "ul",
            "items": [
              "**Silent degradation is the default failure mode.** No exception, no 500, no PagerDuty — just slowly worse decisions. Build drift monitors *before* you build the model.",
              "**The training/serving boundary is where bugs hide.** If two different codepaths compute the same feature, one of them is wrong. Use a **feature store** or share the exact function.",
              "**Reproducibility is a feature, not a chore.** When prod breaks, you need to recreate the exact model from six weeks ago — same data, same code, same seed. Pin everything.",
              "**Retraining is part of the SLA.** Decide upfront: scheduled (weekly), triggered (drift > threshold), or continuous. *Never* the unspoken fourth option: 'when someone complains.'"
            ]
          },
          {
            "type": "p",
            "text": "**Key insight:** DevOps optimizes for *delivering the artifact*. MLOps optimizes for *keeping the artifact correct as the world changes*. Same tools, different objective function — and the objective is what determines the architecture."
          }
        ]
      }
    ]
  },
  "m4": {
    "sections": [
      {
        "heading": "The 40-line wrap",
        "body": [
          {
            "type": "p",
            "text": "You have a pickled sklearn model on disk and a Slack thread asking 'can we hit it from the app today?' This lesson is the **copy-paste answer**. Not a lab, not a deep dive — just the minimum FastAPI service that loads a model, exposes `/predict`, and answers `/health` for your load balancer."
          },
          {
            "type": "p",
            "text": "The full lab (`ml-inference-api`) covers batching, async workers, Pydantic validation depth, and observability. **This** is the back-of-napkin version you ship before lunch."
          }
        ]
      },
      {
        "heading": "The whole file",
        "body": [
          {
            "type": "p",
            "text": "**Setup + schemas** — load the model once at import time, define the request and response shapes."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# app.py — minimal sklearn inference wrap\nfrom fastapi import FastAPI, HTTPException  # web framework + error type\nfrom pydantic import BaseModel  # request schema validation\nimport joblib  # sklearn's pickle of choice\nimport numpy as np  # for feature array shaping\nimport os  # env var lookup\n\nMODEL_PATH = os.getenv(\"MODEL_PATH\", \"model.pkl\")  # configurable path\nmodel = joblib.load(MODEL_PATH)  # load ONCE at import time\n\napp = FastAPI(title=\"quick-wrap\")  # one-line app instance\n\nclass Features(BaseModel):  # request body schema\n    x: list[float]  # flat feature vector\n\nclass Prediction(BaseModel):  # response body schema\n    y: float  # single scalar output\n    model_version: str  # for client-side logging\n\nMODEL_VERSION = os.getenv(\"MODEL_VERSION\", \"dev\")  # tag every response"
          },
          {
            "type": "p",
            "text": "**The three routes** — cheap `/health` for the LB, `/ready` that fails 503 if the model didn't load, and `/predict` that converts client errors to 400 instead of leaking stack traces."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "@app.get(\"/health\")  # k8s/ALB probe target\ndef health():  # no model call here\n    return {\"status\": \"ok\"}  # always cheap, always 200\n\n@app.get(\"/ready\")  # separate readiness check\ndef ready():  # verifies model loaded\n    if model is None:  # paranoia guard\n        raise HTTPException(503, \"no model\") # tell LB to skip us\n    return {\"status\": \"ready\"}  # served only when loaded\n\n@app.post(\"/predict\", response_model=Prediction)  # typed response\ndef predict(req: Features):  # Pydantic parses + validates\n    try:  # catch shape/type errors\n        x = np.array(req.x).reshape(1, -1)   # sklearn wants 2D input\n        y = float(model.predict(x)[0])  # extract scalar from array\n    except Exception as e:  # never leak stack traces\n        raise HTTPException(400, str(e))  # 400 = client's bad input\n    return Prediction(y=y, model_version=MODEL_VERSION)  # typed out"
          }
        ]
      },
      {
        "heading": "Why these choices",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Load at import, not per-request",
                "def": "joblib.load runs once when uvicorn imports app.py. Per-request loads add 50-500ms and re-allocate memory each call."
              },
              {
                "term": "/health vs /ready split",
                "def": "/health proves the process is alive (LB keeps routing). /ready proves the model loaded (LB pauses traffic if no). K8s reads them as separate probes."
              },
              {
                "term": "Pydantic for both directions",
                "def": "Request schema rejects bad payloads with auto-generated 422 errors. Response schema strips extra fields and documents your API in /docs for free."
              },
              {
                "term": "MODEL_VERSION in response",
                "def": "When predictions drift, you need to know which model produced them. Stamp it server-side, not client-side."
              }
            ]
          }
        ]
      },
      {
        "heading": "Run it",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "pip install fastapi uvicorn[standard] joblib scikit-learn  # deps\nMODEL_PATH=./model.pkl MODEL_VERSION=v1.2 \\\n  uvicorn app:app --host 0.0.0.0 --port 8000  # bind all interfaces\n\n# test from another shell:\ncurl -s localhost:8000/health  # expect {\"status\":\"ok\"}\ncurl -s -X POST localhost:8000/predict \\\n  -H 'content-type: application/json' \\\n  -d '{\"x\":[5.1,3.5,1.4,0.2]}'  # iris-shaped input"
          }
        ]
      },
      {
        "heading": "Request flow",
        "body": [
          {
            "type": "diagram",
            "title": "One predict call",
            "nodes": [
              {
                "id": "c",
                "label": "client",
                "subtitle": "curl / app",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "u",
                "label": "uvicorn",
                "subtitle": "ASGI worker",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "p",
                "label": "pydantic",
                "subtitle": "validate Features",
                "x": 0.55,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "m",
                "label": "model",
                "subtitle": "in-process",
                "x": 0.78,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "r",
                "label": "Prediction",
                "subtitle": "typed JSON out",
                "x": 0.55,
                "y": 0.75,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "c",
                "to": "u",
                "label": "POST /predict",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "u",
                "to": "p",
                "kind": "solid"
              },
              {
                "from": "p",
                "to": "m",
                "label": "np.reshape",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "m",
                "to": "r",
                "label": "predict",
                "kind": "dashed",
                "accent": "earth"
              },
              {
                "from": "r",
                "to": "c",
                "label": "200 JSON",
                "kind": "dashed",
                "accent": "water"
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "table",
            "headers": [
              "Trap",
              "Safe?",
              "Why"
            ],
            "rows": [
              [
                "Loading model inside `predict()`",
                "✗",
                "Reloads pickle every request, ~100ms tax"
              ],
              [
                "Returning raw `model.predict(x)`",
                "✗",
                "numpy types break JSON serialization"
              ],
              [
                "Using `/health` as readiness probe",
                "✗",
                "LB keeps sending traffic before model loads"
              ],
              [
                "Pickle from a different sklearn version",
                "✗",
                "Silent attribute errors at first request"
              ],
              [
                "Single uvicorn worker for CPU-bound model",
                "✗",
                "One slow request blocks all others"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Version skew** is the silent killer. Pin sklearn in your `requirements.txt` to the exact version that trained the model — joblib will load a mismatched pickle and then explode on the first `predict()` call, not at startup. Add `sklearn.__version__` to your `/ready` check if you've been bitten before."
          },
          {
            "type": "quote",
            "text": "Ship the wrap today, harden it tomorrow. The full lab teaches you why each line of the hardened version exists — this lesson is the line you ship first."
          }
        ]
      }
    ]
  },
  "m5": {
    "sections": [
      {
        "heading": "The project plan, not the algorithm",
        "body": [
          {
            "type": "p",
            "text": "The main lesson teaches you **what drift is** and **which statistic to use**. This lesson is different: it's the **milestone breakdown** you'd hand a junior engineer on day one. Four milestones, four merges, four demos."
          },
          {
            "type": "p",
            "text": "Each milestone is a **vertical slice** — it does something observable end-to-end before the next one starts. No 'we'll wire it up later'. You want a working stub at M1 so the team can see the shape."
          }
        ]
      },
      {
        "heading": "The four milestones",
        "body": [
          {
            "type": "diagram",
            "title": "Milestone dependency graph",
            "nodes": [
              {
                "id": "m1",
                "label": "M1 Window",
                "subtitle": "sliding buffer",
                "x": 0.1,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "m2",
                "label": "M2 Stats",
                "subtitle": "summarize",
                "x": 0.37,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "m3",
                "label": "M3 Compare",
                "subtitle": "ref vs live",
                "x": 0.64,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "m4",
                "label": "M4 Alert",
                "subtitle": "threshold",
                "x": 0.9,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "m1",
                "to": "m2",
                "kind": "dashed",
                "label": "batch"
              },
              {
                "from": "m2",
                "to": "m3",
                "kind": "dashed",
                "label": "summary"
              },
              {
                "from": "m3",
                "to": "m4",
                "kind": "dashed",
                "label": "score"
              }
            ]
          },
          {
            "type": "ol",
            "items": [
              "**M1 — Sliding window**. Buffer the last N predictions in memory. Demo: print buffer on every push.",
              "**M2 — Batch statistics**. Compute mean, std, and a histogram per window. Demo: log summary on flush.",
              "**M3 — Reference comparison**. Load a frozen reference window, compute **PSI** or **KS** against live. Demo: print score per minute.",
              "**M4 — Threshold alert**. Fire when score crosses ε for K consecutive windows. Demo: webhook hits a fake URL."
            ]
          }
        ]
      },
      {
        "heading": "The heart of each milestone",
        "body": [
          {
            "type": "h3",
            "text": "M1 — the ring buffer"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from collections import deque  # bounded FIFO, O(1) ends\n\nclass Window:\n    def __init__(self, n=1000):\n        self.buf = deque(maxlen=n)  # auto-evicts oldest\n        self.n = n  # window size N\n\n    def push(self, x: float):\n        self.buf.append(x)  # drop happens silently\n\n    def ready(self) -> bool:\n        return len(self.buf) == self.n   # only score full windows"
          },
          {
            "type": "h3",
            "text": "M2 — the summary"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np  # vectorized stats\n\ndef summarize(buf, bins):\n    a = np.fromiter(buf, dtype=np.float32)  # one allocation, no copies later\n    hist, _ = np.histogram(a, bins=bins)  # share bins with reference\n    p = hist / hist.sum()  # normalize to probability\n    return {\"mean\": a.mean(), \"std\": a.std(), \"p\": p}  # tiny dict, cheap to ship"
          },
          {
            "type": "h3",
            "text": "M3 — the comparison"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "EPS = 1e-6  # avoid log(0) blowup\n\ndef psi(p_ref, p_live):\n    p_ref = np.clip(p_ref, EPS, 1)  # floor both sides\n    p_live = np.clip(p_live, EPS, 1)  # symmetric clipping\n    return float(np.sum((p_live - p_ref) * np.log(p_live / p_ref)))  # PSI scalar"
          },
          {
            "type": "h3",
            "text": "M4 — the alert"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "K = 3  # hysteresis: K-in-a-row\n\nclass Alerter:\n    def __init__(self, eps=0.2):\n        self.eps = eps  # PSI threshold (0.2 = moderate)\n        self.streak = 0  # consecutive breaches\n\n    def observe(self, score, sink):\n        self.streak = self.streak + 1 if score > self.eps else 0  # reset on calm\n        if self.streak == K:  # fire once, not every tick\n            sink.post({\"psi\": score, \"streak\": K})  # webhook / pager / log"
          }
        ]
      },
      {
        "heading": "Why this order — and the trap in each step",
        "body": [
          {
            "type": "table",
            "headers": [
              "Milestone",
              "Cheap because",
              "Watch out for"
            ],
            "rows": [
              [
                "M1 Window",
                "`deque(maxlen=N)` is one line",
                "Per-feature windows multiply memory by D"
              ],
              [
                "M2 Stats",
                "`numpy` handles vectorization",
                "**Bin edges must come from the reference**, not live"
              ],
              [
                "M3 Compare",
                "PSI is 5 lines",
                "Empty bins → ∞ without ε clipping"
              ],
              [
                "M4 Alert",
                "Streak counter is trivial",
                "No hysteresis ⇒ pager fatigue on flapping signals"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "quote",
            "text": "The milestone you'll be tempted to skip is M1 — it feels too small. Ship it anyway; it's the only one that proves your data pipeline is wired.",
            "cite": "every drift project, in hindsight"
          },
          {
            "type": "p",
            "text": "Each milestone produces a **demoable artifact**: a printed buffer, a logged summary, a score in stdout, a webhook hit. If a milestone can't be demoed on its own, it's not a milestone — it's a refactor in disguise."
          }
        ]
      }
    ]
  },
  "ml-intro-what-it-does": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          { "type": "p", "text": "**Traditional code is a recipe; ML is a taste-tester.** With a recipe, you write down every step — *if the soup is too salty, add a potato*. With a taste-tester, you serve thousands of bowls, listen to which ones got good reviews, and let the system *figure out on its own* which ingredients matter. ML is what you reach for when you can't write the recipe — when the rules are too tangled or too many to spell out by hand." }
        ]
      },
      {
        "heading": "Rules vs patterns",
        "body": [
          { "type": "p", "text": "Classical software is rule-based. You enumerate inputs and prescribe outputs. That works great until the input space gets too messy — handwriting, faces, search relevance, fraud — at which point rules collapse under their own weight." },
          { "type": "p", "text": "ML flips the workflow. You feed in many (input → desired output) examples. The training algorithm searches a space of functions for one that maps inputs to outputs *consistently across the data*. The output is a function — usually opaque, often surprising — that generalizes." }
        ]
      },
      {
        "heading": "When ML is the right tool",
        "body": [
          { "type": "ul", "items": [
            "You can collect (or already have) lots of labeled examples.",
            "The problem has patterns that humans struggle to articulate.",
            "Being right *most of the time* is acceptable — 100% correctness isn't required.",
            "The cost of a wrong answer is bounded, recoverable, or reviewable."
          ]}
        ]
      },
      {
        "heading": "When it isn't",
        "body": [
          { "type": "ul", "items": [
            "The rule is simple — a regex or `if` statement does it.",
            "You need provable correctness (taxes, payroll, safety-critical control).",
            "You can't get labels or your labels are noisier than the signal.",
            "The system needs to explain *every* decision and you can't afford interpretability tooling."
          ]}
        ]
      },
      {
        "heading": "How to think about it",
        "body": [
          { "type": "p", "text": "Treat ML as **statistical software**: a function whose behavior is *fit* rather than *written*. That mental model leads you to the right questions — what's the training distribution? what's the loss? how do we measure success? — instead of treating the model as a magic black box that should 'just work'." }
        ]
      }
    ]
  },

  // ─── CORE MODELS (mlops) ──────────────────────────────────────────────────
  "ml-core-linear-regression": {
    "sections": [
      {
        "heading": "The simplest model that actually works",
        "body": [
          {
            "type": "p",
            "text": "**Linear regression** draws a straight line through your data points: `y = mx + b`. That's it. You pick `m` (slope) and `b` (intercept) so the line lands as close as possible to every point at once."
          },
          {
            "type": "p",
            "text": "\"As close as possible\" means **minimizing the sum of squared distances** between predictions and actuals. Square the errors so positive and negative misses don't cancel, and so big misses hurt disproportionately more than small ones."
          },
          {
            "type": "quote",
            "text": "If linear regression fits your problem, ship it. Interpretability and speed beat a 0.3% accuracy bump from a neural net you can't debug.",
            "cite": "every senior ML engineer, eventually"
          }
        ]
      },
      {
        "heading": "From one feature to many",
        "body": [
          {
            "type": "p",
            "text": "Real problems have more than one input. **Multi-feature linear regression** stacks weights: `y = w₁x₁ + w₂x₂ + ... + wₙxₙ + b`. Same math, more knobs. Each `wᵢ` tells you the **marginal effect** of feature `i` — how much `y` shifts when `xᵢ` moves by one unit, holding everything else fixed."
          },
          {
            "type": "p",
            "text": "Want curves? Add `x²` as a new feature. The model is still *linear in the weights* — it doesn't know `x²` is special — but the fit bends. This trick is called **polynomial features**, and it's how a \"linear\" model captures quadratic, cubic, or interaction effects."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.linear_model import LinearRegression   # the workhorse\nimport numpy as np\n\nX = np.array([[1, 1], [2, 4], [3, 9], [4, 16]])  # feature 2 is x₁² — polynomial trick\ny = np.array([3, 8, 15, 24])  # target values\n\nmodel = LinearRegression().fit(X, y)  # closed-form solve, no gradient descent\nprint(model.coef_)  # one weight per feature\nprint(model.intercept_)  # the b term\nmodel.predict([[5, 25]])  # must include the x² feature too"
          }
        ]
      },
      {
        "heading": "The neural net connection",
        "body": [
          {
            "type": "p",
            "text": "Here's the secret nobody tells beginners: **a neural network layer is literally `y = Wx + b` followed by a nonlinearity**. Linear regression is one such layer with the nonlinearity removed. Stack two of them with a `ReLU` between, and you've got a tiny neural net."
          },
          {
            "type": "diagram",
            "title": "Linear regression vs. one neural net layer",
            "nodes": [
              {
                "id": "x1",
                "label": "x",
                "subtitle": "input features",
                "x": 0.1,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "lin",
                "label": "Wx + b",
                "subtitle": "linreg",
                "x": 0.45,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "act",
                "label": "σ(·)",
                "subtitle": "ReLU · sigmoid",
                "x": 0.75,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "y",
                "label": "y",
                "subtitle": "prediction",
                "x": 0.95,
                "y": 0.5,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "x1",
                "to": "lin",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "lin",
                "to": "act",
                "kind": "dashed",
                "accent": "sky",
                "label": "NN adds this"
              },
              {
                "from": "act",
                "to": "y",
                "kind": "dashed",
                "accent": "amber"
              }
            ]
          },
          {
            "type": "p",
            "text": "This means everything you learn about linear regression — coefficients, loss, gradients — is the **atomic unit** of deep learning. Master the line; the rest is composition."
          }
        ]
      },
      {
        "heading": "When to reach for it",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Use linear regression when",
            "watchLabel": "Skip it when",
            "good": [
              "You need **interpretable coefficients** for a stakeholder or regulator.",
              "Features are roughly linearly related to the target.",
              "You have **few rows** (< 10k) — deep nets will overfit.",
              "Inference latency matters — it's a dot product, microseconds.",
              "You're establishing a **baseline** before anything fancier."
            ],
            "watch": [
              "Relationships are sharply nonlinear and you can't engineer features.",
              "Features interact in complex, high-order ways (images, text, audio).",
              "You need to model sequences, hierarchies, or attention patterns.",
              "The signal lives in millions of subtle feature combinations."
            ]
          },
          {
            "type": "table",
            "headers": [
              "Variant",
              "What it adds",
              "When"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "**OLS**",
                "Plain least-squares",
                "Default. Always try this first."
              ],
              [
                "**Ridge**",
                "L2 penalty on weights",
                "Many correlated features"
              ],
              [
                "**Lasso**",
                "L1 penalty — zeroes out weights",
                "Want automatic feature selection"
              ],
              [
                "**ElasticNet**",
                "L1 + L2 mix",
                "Best of both, one extra knob"
              ],
              [
                "**Polynomial**",
                "Adds `xⁿ` features",
                "Smooth nonlinearity, low-dimensional"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Reaching for deep nets first",
                "def": "The classic beginner mistake. Fit a line, look at the residuals, *then* decide if you need something heavier."
              },
              {
                "term": "Unscaled features",
                "def": "If `x₁` is in dollars (10⁶) and `x₂` is in years (10¹), regularization will crush the wrong weight. Standardize first."
              },
              {
                "term": "Multicollinearity",
                "def": "Two features that move together make individual coefficients unstable and uninterpretable. Drop one or switch to Ridge."
              },
              {
                "term": "Extrapolation",
                "def": "A line trained on `x ∈ [0, 10]` will happily predict for `x = 1000` — and be catastrophically wrong. The model has no idea it's out of bounds."
              },
              {
                "term": "Confusing correlation for causation",
                "def": "A nonzero coefficient means the feature *predicts* the target in your data, not that changing it will *cause* the target to change."
              }
            ]
          },
          {
            "type": "p",
            "text": "**Key insight:** linear regression is not a beginner's toy you outgrow. It's the **null hypothesis** of modeling — the thing every fancier model has to beat. If your XGBoost ensemble only edges out a clean OLS fit by half a percent, the OLS is what goes to production."
          }
        ]
      }
    ]
  },

  // ─── WORKING WITH DATA (mlops) ────────────────────────────────────────────
  "ml-data-numerical": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          { "type": "p", "text": "**Numerical features are ingredients in wildly different units — grams, gallons, dashes.** A neural net adding them up cares about *magnitude*, not meaning. If one feature is in millions and another in 0-to-1, the millions one drowns out the rest before training even starts. Scaling levels the playing field." }
        ]
      },
      {
        "heading": "Standardization vs normalization",
        "body": [
          { "type": "ul", "items": [
            "**Standardization** (z-score): subtract the mean, divide by the standard deviation. Result has mean 0 and std 1. Good default for most algorithms.",
            "**Min-max normalization**: rescale to [0, 1] (or [-1, 1]). Useful when you need bounded inputs (e.g. image pixels).",
            "**Robust scaling**: subtract the median, divide by the IQR. Resists outliers when your distribution has heavy tails."
          ]}
        ]
      },
      {
        "heading": "Log transforms",
        "body": [
          { "type": "p", "text": "When a feature spans many orders of magnitude — income, file sizes, follower counts — take `log(1+x)` first. It compresses the long tail and makes the relationship more linear. Tree models don't need this; gradient-based models almost always do." }
        ]
      },
      {
        "heading": "Bucketing",
        "body": [
          { "type": "p", "text": "Sometimes the *relationship* isn't linear. Age might matter in life stages (0-17, 18-29, 30-50, 50+) rather than as a continuous number. Slicing into buckets and one-hot encoding the bucket lets the model assign each band its own weight." }
        ]
      },
      {
        "heading": "Fit on train only",
        "body": [
          { "type": "p", "text": "Compute scaling statistics on the training set, then apply that *same* transformation to validation and test. Fitting on the full dataset leaks test info into training and inflates your offline numbers." }
        ]
      }
    ]
  },

  // ─── APPLIED ML (mlops — first is recsys) ─────────────────────────────────
  "ml-applied-recsys": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          { "type": "p", "text": "**A good recommender is a librarian who's been watching you for years.** They've noticed which shelves you linger at, which books you returned in a day, which ones you took home for a month. They don't need to read the books — they just need to know who else borrowed similar combinations. That's collaborative filtering in a sentence." }
        ]
      },
      {
        "heading": "Collaborative filtering",
        "body": [
          { "type": "p", "text": "Build a matrix of users × items, filled with ratings (or implicit signals like clicks). Most cells are empty. Factor that matrix into user-vectors and item-vectors whose dot products approximate the observed ratings. To recommend, multiply a user's vector against unseen items and pick the top scores." },
          { "type": "p", "text": "Pure CF has one famous weakness: **the cold start.** A brand-new item has no ratings, so it gets recommended to nobody, so it never gets ratings. Hybrid systems plug that hole." }
        ]
      },
      {
        "heading": "Content-based",
        "body": [
          { "type": "p", "text": "Skip the user behavior; describe items by their features (genre, author, embedding vector). Recommend items whose features look like what the user has liked before. Solves cold start for new items but ignores collaborative signal — you'll over-recommend obvious lookalikes." }
        ]
      },
      {
        "heading": "Hybrid in practice",
        "body": [
          { "type": "p", "text": "Almost every real-world recommender (Netflix, Spotify, YouTube) is hybrid: a candidate-generation stage (CF + content) feeds a ranking model (gradient boosted trees, then a deep model) that scores hundreds of candidates against contextual features — time of day, device, recent session." },
          { "type": "ul", "items": [
            "**Retrieval**: cast a wide net cheaply (approximate nearest neighbors on item embeddings).",
            "**Ranking**: score the shortlist with a heavier model, optimizing for clicks, watch time, or revenue.",
            "**Diversity / freshness**: add explicit rules so the feed isn't ten of the same thing."
          ]}
        ]
      },
      {
        "heading": "Metrics that matter",
        "body": [
          { "type": "p", "text": "Offline: precision@k, recall@k, NDCG. Online: click-through rate, dwell time, conversion. Always A/B test before launching — recommender offline metrics famously disagree with user behavior." }
        ]
      }
    ]
  },

  // ─── PRODUCTION ML (mlops — first is systems) ─────────────────────────────
  "ml-prod-systems": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          { "type": "p", "text": "**A model is a fish; the production system is the aquarium.** The fish is small, beautiful, and the part everyone talks about. The aquarium — filtration, temperature, feeding schedule, the person who notices when the water turns cloudy — is 90% of the work and the only reason the fish keeps living. Most of what we call 'ML in production' is aquarium engineering." }
        ]
      },
      {
        "heading": "The pipeline",
        "body": [
          { "type": "ol", "items": [
            "**Data ingestion** — landing raw events into a lake/warehouse.",
            "**Feature pipeline** — joining, cleaning, deriving features; writing them to a feature store.",
            "**Training pipeline** — pulling a frozen snapshot, training, evaluating, registering a model.",
            "**Serving** — loading the model into a low-latency server (or batch job) and exposing predictions.",
            "**Monitoring** — watching inputs (drift), outputs (calibration), and downstream KPIs.",
            "**Retraining** — automated or manual, on a schedule or a trigger."
          ]}
        ]
      },
      {
        "heading": "Feature stores",
        "body": [
          { "type": "p", "text": "The same feature must be computable the same way in training and serving — otherwise you get train/serve skew and your offline accuracy is a lie. A feature store provides a single definition with two execution paths: a batch backend (for training) and a low-latency online backend (for serving), guaranteeing they agree." }
        ]
      },
      {
        "heading": "Model serving",
        "body": [
          { "type": "ul", "items": [
            "**Online**: low latency (ms), one request at a time. Triton, TF-Serving, TorchServe, FastAPI in front.",
            "**Batch**: high throughput, run nightly or hourly. Spark / Beam / Dataflow / a Python script in K8s.",
            "**Streaming**: feature freshness measured in seconds. Flink / Kafka Streams. Hard to debug."
          ]}
        ]
      },
      {
        "heading": "What goes wrong",
        "body": [
          { "type": "p", "text": "Models silently rot. Upstream data schemas change. Feature pipelines fall behind. A new label policy makes yesterday's training set wrong. Treat the pipeline like any other production system: SLOs, alerts, runbooks, ownership. The model is the cheapest piece to rebuild — the data and the pipeline are the real assets." }
        ]
      }
    ]
  },

  // ─── NEURAL NETS & BEYOND (mleng — first is fundamentals) ─────────────────
  "ml-intro-paradigms": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture three kids learning to sort Lego.** The first kid has a parent next to her saying \"that's a wheel, that's a brick, that's a window\" for every piece — she learns by **labeled examples**. The second kid is alone with a giant pile and just starts grouping by color and shape on his own — he finds **structure without labels**. The third kid is building a spaceship and gets a thumbs-up when it flies, a frown when it tips — she learns from **reward signals** over many tries."
          },
          {
            "type": "p",
            "text": "Those three kids are **supervised learning**, **unsupervised learning**, and **reinforcement learning**. Same Lego, totally different feedback loops."
          }
        ]
      },
      {
        "heading": "The three paradigms",
        "body": [
          {
            "type": "h3",
            "text": "Supervised"
          },
          {
            "type": "p",
            "text": "You have pairs `(x, y)` — an input and the correct answer. The model learns a function `f(x) → y` by minimizing the gap between its guess and the label. Spam detection, house-price prediction, image classification."
          },
          {
            "type": "h3",
            "text": "Unsupervised"
          },
          {
            "type": "p",
            "text": "You have only `x`. No answer key. The model finds **structure**: clusters of similar customers, low-dimensional embeddings of words, anomalies in server logs. You discover what's there, not what you were told to find."
          },
          {
            "type": "h3",
            "text": "Reinforcement"
          },
          {
            "type": "p",
            "text": "An **agent** takes actions in an **environment**, receives a **reward**, and updates its policy to get more reward over time. No labels — just delayed, noisy feedback. Game-playing bots, robot control, RLHF for LLMs."
          }
        ]
      },
      {
        "heading": "How the feedback differs",
        "body": [
          {
            "type": "code",
            "lang": "txt",
            "text": "supervised   : data = {(x₁, y₁), (x₂, y₂), ...}     loss = Σ (ŷ − y)²\nunsupervised : data = {x₁, x₂, ...}                 loss = reconstruction / cluster cost\nreinforcement: data = (state, action, reward, ...)  goal = max ∑ γᵗ · rₜ"
          },
          {
            "type": "p",
            "text": "The shape of your data is the giveaway. **Got labels?** Supervised. **No labels, just observations?** Unsupervised. **An agent acting over time with rewards?** RL."
          }
        ]
      },
      {
        "heading": "A quick code sniff test",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "# supervised — fit(X, y)\nmodel.fit(X_train, y_train)\npreds = model.predict(X_test)\n\n# unsupervised — fit(X)\nkmeans.fit(X)\nclusters = kmeans.labels_\n\n# reinforcement — step through an env\nstate = env.reset()\nfor t in range(T):\n    action = policy(state)\n    state, reward, done, _ = env.step(action)\n    policy.update(state, action, reward)"
          },
          {
            "type": "p",
            "text": "If `.fit` takes a `y`, it's supervised. If `.fit` takes only `X`, unsupervised. If you see `env.step` and `reward`, you're in RL territory."
          }
        ]
      },
      {
        "heading": "When to use which",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Supervised** — you can cheaply collect ground-truth labels and the task is \"predict this thing\". 80% of production ML.",
              "**Unsupervised** — labels are expensive or undefined, and you want to *understand* the data: segmentation, dimensionality reduction, pretraining.",
              "**Reinforcement** — the task is **sequential decisions** under uncertainty and you can simulate or safely interact with the environment. Expensive, sample-hungry, but unmatched for control."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "Beginners default to **supervised** for everything, then drown in labeling cost. Before launching a labeling project, ask: can clustering or self-supervised pretraining give me 80% of the signal for free?"
          },
          {
            "type": "p",
            "text": "And don't reach for **RL** because it sounds cool. RL needs millions of interactions, careful reward design, and reward hacking will bite you. If a supervised baseline works, ship it."
          }
        ]
      }
    ]
  },
  "ml-intro-framing": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a detective at a crime scene.** Before dusting for prints or interviewing witnesses, they decide *what question they are actually answering* — was this a robbery, an accident, an inside job? Pick the wrong question and every clue you collect is wasted effort. **Problem framing** is the same move: you decide what you are really predicting before you touch a single row of data."
          }
        ]
      },
      {
        "heading": "What framing actually is",
        "body": [
          {
            "type": "p",
            "text": "Framing turns a fuzzy business wish (*\"reduce churn\"*) into a **concrete prediction task** a model can learn. You name the **target variable**, the **input features available at decision time**, the **prediction horizon**, and the **unit of prediction** (per user? per session? per day?)."
          },
          {
            "type": "p",
            "text": "A well-framed problem reads like a sentence: *\"Given a user's activity in the last 14 days, predict the probability they will cancel in the next 7 days.\"* If you can't write that sentence, you are not ready to model."
          }
        ]
      },
      {
        "heading": "The four framing questions",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Target** — what exactly are you predicting? A label, a number, a ranking?",
              "**Inputs** — what features will realistically exist *at inference time*, not just in your training dump?",
              "**Horizon** — over what window does the prediction apply? Next click, next week, next quarter?",
              "**Granularity** — one prediction per what? User, transaction, image, sentence?"
            ]
          },
          {
            "type": "p",
            "text": "Answer these four and you have collapsed a vague goal into a **supervised learning contract** the rest of the pipeline can honor."
          }
        ]
      },
      {
        "heading": "Reframing in practice",
        "body": [
          {
            "type": "p",
            "text": "*\"Detect fraud\"* is not a task. **Reframe it** as: *binary classification of each transaction, using merchant, amount, device, and 30-day user history, predicting whether it will be charged back within 60 days.* Now you know the label source (chargebacks), the **label delay** (60 days), and the **class imbalance** problem you are walking into."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# The framing, written down before any modeling\ntask        = \"binary_classification\"\ntarget      = \"chargeback_within_60d\"\nunit        = \"transaction\"\nhorizon_d   = 60\nfeatures_at = \"t = authorization_time\"   # no post-auth leakage\nbaseline    = \"rules engine, 0.72 recall @ 0.04 FPR\""
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Label leakage** — using a feature that only exists *after* the outcome is known. Classic trap when joining warehouse tables.",
              "**Wrong unit** — predicting per-user when the business acts per-session, or vice versa. Your metric will lie to you.",
              "**Mismatched horizon** — training on \"churn ever\" but deploying for \"churn next week\". Same data, different problem.",
              "**No baseline** — if you can't beat a simple rule or last-week's-value, you have not solved the framed task; you have just built a model."
            ]
          },
          {
            "type": "p",
            "text": "Spend an hour framing and you save a month modeling. Skip it and you will ship something accurate at answering the *wrong* question — the most expensive kind of correct."
          }
        ]
      }
    ]
  },
  "ml-core-logistic-regression": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a bouncer at a club door.** Each person walks up and the bouncer scores them on a few signals — guest list, dress code, sobriety — then squashes that score into a single yes/no decision. The score itself is a straight line; the squash is what turns it into a probability of getting in."
          },
          {
            "type": "p",
            "text": "**Logistic regression** is that bouncer. It draws a linear boundary through your features, then pipes the result through a smooth S-curve so the output reads as a **probability** between 0 and 1, not an unbounded number."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "You weight each input feature, sum them up, add a bias, and shove the result through the **sigmoid** σ. The output is P(y=1 | x) — the probability this example belongs to the positive class."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "z = θ₀ + θ₁·x₁ + θ₂·x₂ + ... + θₙ·xₙ\n\nσ(z) = 1 / (1 + e^−z)\n\nP(y=1 | x) = σ(θ · x)"
          },
          {
            "type": "p",
            "text": "The decision boundary lives where σ(z) = 0.5, i.e. z = 0. That boundary is **linear in the features** — which is why logistic regression is fast, interpretable, and stops working when classes curl around each other."
          }
        ]
      },
      {
        "heading": "How it learns",
        "body": [
          {
            "type": "p",
            "text": "You don't use squared error here — it makes the loss surface bumpy. Instead you minimize **binary cross-entropy** (a.k.a. log loss), which is convex and punishes confident wrong predictions hard."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "L(θ) = −(1/m) ∑ [ yᵢ·log(σ(zᵢ)) + (1−yᵢ)·log(1−σ(zᵢ)) ]\n\nθ ← θ − η · ∇L(θ)\n\n∇L = (1/m) ∑ (σ(zᵢ) − yᵢ) · xᵢ"
          },
          {
            "type": "p",
            "text": "Notice the gradient: it's the **error** (prediction minus label) scaled by the input. Same shape as linear regression's update — the sigmoid does its work inside the prediction, not the gradient formula."
          }
        ]
      },
      {
        "heading": "In practice",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.linear_model import LogisticRegression\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.pipeline import make_pipeline\n\nclf = make_pipeline(\n    StandardScaler(),\n    LogisticRegression(penalty=\"l2\", C=1.0, max_iter=1000),\n)\nclf.fit(X_train, y_train)\n\nprobs = clf.predict_proba(X_test)[:, 1]\npreds = (probs > 0.5).astype(int)"
          },
          {
            "type": "p",
            "text": "Always **scale your features** — the gradient steps assume comparable magnitudes. Tune the regularization strength `C` (smaller = stronger penalty) and pick the decision threshold based on your precision/recall tradeoff, not a reflexive 0.5."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Non-linear boundaries** — if classes interleave, add polynomial features or switch to trees/SVMs with kernels.",
              "**Class imbalance** — 99% negatives means a 0.5 threshold is useless. Use `class_weight=\"balanced\"` and look at PR-AUC, not accuracy.",
              "**Perfect separation** — when classes are linearly separable, weights blow up to ±∞. L2 regularization keeps them finite.",
              "**Multicollinearity** — correlated features make coefficients unstable and unreadable. Drop or combine them before claiming interpretability.",
              "**Probability calibration** — the raw scores are usually well-calibrated, but verify with a reliability plot before betting decisions on them."
            ]
          }
        ]
      }
    ]
  },
  "ml-core-classification-metrics": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a hospital triage nurse** at the door of the ER. Every patient walks in, and within seconds she sorts them into buckets: critical, urgent, routine, send home. She is not predicting a number — she is picking a **label**. That is classification."
          },
          {
            "type": "p",
            "text": "Now imagine her boss grading her at the end of the shift. He does not just count how many she got right. He asks: *how many critical patients did she miss?* Missing one of those is a disaster. Sending a routine patient to the critical room is just expensive. **Different mistakes cost different things** — and that is why accuracy alone is a lie."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "A **classifier** maps inputs to one of K discrete classes. Binary classifiers output a probability `p ∈ [0,1]` and you threshold it — typically at 0.5, but rarely should you leave it there."
          },
          {
            "type": "p",
            "text": "The workhorses you will actually ship: **logistic regression** (linear, calibrated, interpretable), **gradient-boosted trees** (XGBoost, LightGBM — usually the strongest on tabular), and **neural nets** for text and images. Pick the simplest that clears the bar."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import classification_report, roc_auc_score\n\nclf = LogisticRegression(max_iter=1000).fit(X_train, y_train)\nproba = clf.predict_proba(X_test)[:, 1]\npred  = (proba >= 0.5).astype(int)\n\nprint(classification_report(y_test, pred))\nprint(\"AUC:\", roc_auc_score(y_test, proba))"
          }
        ]
      },
      {
        "heading": "The confusion matrix",
        "body": [
          {
            "type": "p",
            "text": "Every binary prediction lands in one of four buckets. Memorize this — every metric you care about is just arithmetic on these four numbers."
          },
          {
            "type": "ul",
            "items": [
              "**TP** — predicted positive, was positive (true alarm)",
              "**FP** — predicted positive, was negative (false alarm)",
              "**FN** — predicted negative, was positive (missed it)",
              "**TN** — predicted negative, was negative (correct silence)"
            ]
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "accuracy  = (TP + TN) / (TP + FP + FN + TN)\nprecision = TP / (TP + FP)        → of those I flagged, how many were real?\nrecall    = TP / (TP + FN)        → of all the real ones, how many did I catch?\nF1        = 2 · (precision · recall) / (precision + recall)"
          }
        ]
      },
      {
        "heading": "Picking the right metric",
        "body": [
          {
            "type": "p",
            "text": "**Accuracy is misleading on imbalanced data.** If 1% of transactions are fraud, a model that says \"never fraud\" gets 99% accuracy and is useless. Always check the class balance before quoting a number."
          },
          {
            "type": "ul",
            "items": [
              "◇ **Fraud, cancer screening, churn** → optimize **recall**. Missing a positive is the expensive failure.",
              "◇ **Spam filter, content moderation** → optimize **precision**. False positives anger users.",
              "◇ **Balanced classes, no asymmetric cost** → **F1** or **AUC-ROC**.",
              "◇ **Imbalanced + ranking matters** → **AUC-PR** (precision-recall AUC), not ROC."
            ]
          },
          {
            "type": "p",
            "text": "**AUC-ROC** measures how well your scores rank positives above negatives, independent of threshold. It is threshold-free, which is great for model selection — and dangerous when you actually deploy, because in production you *do* pick a threshold."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "▶ **Threshold drift.** You tuned at 0.5; reality wants 0.27. Sweep thresholds on a validation set against your business cost function.",
              "▶ **Calibration ≠ accuracy.** Tree ensembles often output confident-looking probabilities that are wrong. Use **Platt scaling** or **isotonic regression** if you need real probabilities downstream.",
              "▶ **Leakage inflates every metric.** If a feature encodes the label (e.g. `account_closed_date` for churn), your AUC will look heroic and collapse in prod.",
              "▶ **Macro vs micro F1.** Multiclass with imbalance — macro treats every class equally, micro weights by frequency. State which one you reported."
            ]
          },
          {
            "type": "p",
            "text": "Rule of thumb: **never ship a classifier with one number**. Ship the confusion matrix, the threshold, and the cost assumption behind it. That is the artifact a stakeholder can actually argue with."
          }
        ]
      }
    ]
  },
  "ml-core-trees-forests": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a doctor playing twenty questions.** Fever? Yes. Cough? Yes. Travel recently? No. Each answer narrows the suspect list until one diagnosis stands. A **decision tree** is that flowchart — automated, learned from data."
          },
          {
            "type": "p",
            "text": "Now imagine **a room of a hundred doctors**, each trained on a slightly different stack of charts, voting on your case. That mob is a **random forest**. One doctor can be wrong; the crowd rarely is."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "A **decision tree** splits your data into pure-as-possible chunks by asking yes/no questions on features. Each internal node is a split like `age ≤ 35`; each leaf is a prediction — a class label or a number."
          },
          {
            "type": "p",
            "text": "The split it picks is the one that drops **impurity** the most. For classification you use **Gini** or **entropy**; for regression, **variance**. Greedy at every node — no backtracking."
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "Trees are simple. Forests cheat smartly using **bagging** plus **feature subsampling**: train each tree on a bootstrap sample of rows, and at every split consider only a random subset of features. Decorrelated trees, averaged."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.ensemble import RandomForestClassifier\n\nrf = RandomForestClassifier(\n    n_estimators=300,  # number of trees\n    max_depth=None,  # let them grow\n    max_features=\"sqrt\",  # decorrelate splits\n    min_samples_leaf=2,\n    n_jobs=-1,\n    random_state=42,\n)\nrf.fit(X_train, y_train)\nproba = rf.predict_proba(X_test)\nprint(sorted(zip(rf.feature_importances_, X.columns), reverse=True)[:5])"
          },
          {
            "type": "p",
            "text": "**Gradient-boosted trees** (XGBoost, LightGBM) are the other branch of the family — trees built *sequentially*, each one fixing the last one's mistakes. Usually beats random forests on tabular data."
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Tabular king.** On structured business data, tree ensembles still beat deep nets more often than not.",
              "**No scaling needed.** Splits are order-based, so you can skip standardization and one-hot encoding of ordinals.",
              "**Mixed types, missing values.** Handles numeric + categorical together; many implementations route NaNs natively.",
              "**Feature importance for free.** `feature_importances_` and **SHAP** give you an explainability story stakeholders accept."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Single trees overfit hard.** A deep unpruned tree memorizes noise. Cap `max_depth` or `min_samples_leaf`, or use an ensemble.",
              "**Extrapolation is broken.** Trees predict the leaf mean — they cannot project a trend past the training range. Bad for time series with drift.",
              "**Importance lies on correlated features.** Two redundant columns split the credit. Prefer **permutation importance** or **SHAP** for honest answers.",
              "**Forests are big.** 500 trees × deep splits = slow inference and fat artifacts. For latency-critical paths, distill into a boosted model with fewer rounds."
            ]
          }
        ]
      }
    ]
  },
  "ml-data-categorical": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a coat closet labeled with country names — Japan, Brazil, Kenya, Iceland.** The labels don't have a *size*; Japan isn't bigger than Brazil. But a model only speaks numbers. If you naively hand it `country = 7`, it'll happily decide Kenya is half of Iceland and twice as much as Brazil. **Categorical encoding is the job of turning names into numbers without inventing an order that isn't there.**"
          }
        ]
      },
      {
        "heading": "One-hot encoding",
        "body": [
          {
            "type": "p",
            "text": "The safe default. For a column with *k* categories, you create *k* new columns of 0s and 1s — exactly one is hot per row. No fake ordering, no fake distances. Works great until *k* gets large."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import pandas as pd\n\ndf = pd.DataFrame({\"country\": [\"JP\", \"BR\", \"KE\", \"JP\"]})\nencoded = pd.get_dummies(df, columns=[\"country\"], prefix=\"c\")\n#    c_BR  c_JP  c_KE\n# 0     0     1     0\n# 1     1     0     0\n# 2     0     0     1\n# 3     0     1     0"
          }
        ]
      },
      {
        "heading": "When one-hot breaks",
        "body": [
          {
            "type": "p",
            "text": "User IDs, product SKUs, zip codes — anything with thousands or millions of values. One-hot explodes your feature matrix and most columns are zero. You need something denser."
          },
          {
            "type": "ul",
            "items": [
              "**Target encoding**: replace each category with the mean of the target for that category. Powerful, but leaks like a sieve if you fit on the full dataset — always compute per-fold or with smoothing.",
              "**Frequency encoding**: replace each category with how often it appears. Cheap, no leakage, surprisingly strong for tree models.",
              "**Hashing trick**: hash the category into a fixed *d*-dimensional bucket. Collisions happen but models tolerate them; lets you stream new categories without growing the schema.",
              "**Embeddings**: learn a dense vector per category jointly with the model. Standard for deep nets and high-cardinality fields."
            ]
          }
        ]
      },
      {
        "heading": "Ordinal vs nominal",
        "body": [
          {
            "type": "p",
            "text": "Some categories *do* have an order — `small < medium < large`, `bronze < silver < gold`. Encode those as integers and the model gets useful structure for free. The mistake is the reverse: stamping integers onto truly nominal data (country, color, browser) and pretending the order means something."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Unseen categories at serve time.** The encoder must have an `unknown` bucket or your prediction call crashes. Decide the policy at training time, not 3am.",
              "**Train/serve skew.** Fit the encoder on training data only, then *persist* it. The same `JP -> column 1` mapping must apply in production — pickle it, version it, ship it with the model.",
              "**Rare categories.** Anything appearing fewer than ~20 times is noise. Collapse them into an `other` bucket before encoding.",
              "**Tree models are forgiving.** XGBoost and LightGBM handle integer-encoded categoricals natively (LightGBM has a dedicated mode). Don't one-hot a 10k-category column for a tree — use the native path."
            ]
          }
        ]
      }
    ]
  },
  "ml-data-splits-leakage": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a chef tasting their own soup before a blind contest.** If the judges' spoons came from the same pot the chef already seasoned to taste, of course it scores perfectly. The real test is a pot the chef has never tasted. Your **training set** is the kitchen, your **test set** is the judges' table, and any spoon that sneaks between them is **leakage**."
          },
          {
            "type": "p",
            "text": "A model that has secretly tasted the test data isn't talented — it's just remembering. You only find out when it hits production and the soup is suddenly bland."
          }
        ]
      },
      {
        "heading": "The three splits",
        "body": [
          {
            "type": "p",
            "text": "Split your data once, up front, before you look at anything. The classic carve-up is **train / validation / test**, each with a different job."
          },
          {
            "type": "ul",
            "items": [
              "**Train** (~70%) — the model fits its parameters here. It can memorize this freely.",
              "**Validation** (~15%) — you tune hyperparameters, pick architectures, and decide when to stop training. The model sees these *indirectly*.",
              "**Test** (~15%) — touched **once**, at the very end, to report honest performance. If you peek and iterate, it becomes another validation set and stops being honest."
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.model_selection import train_test_split\n\n# split off test FIRST, then carve val from the rest\nX_rest, X_test, y_rest, y_test = train_test_split(\n    X, y, test_size=0.15, random_state=42, stratify=y\n)\nX_train, X_val, y_train, y_val = train_test_split(\n    X_rest, y_rest, test_size=0.176, random_state=42, stratify=y_rest\n)  # 0.176 * 0.85 ≈ 0.15"
          }
        ]
      },
      {
        "heading": "How leakage sneaks in",
        "body": [
          {
            "type": "p",
            "text": "**Leakage** is any information about the test set leaking into training — usually by accident. It inflates your metrics during development and shatters them in production."
          },
          {
            "type": "ul",
            "items": [
              "**Preprocessing on the full dataset** — fitting a `StandardScaler` or imputer on all rows before splitting. The mean and σ now encode test statistics.",
              "**Target leakage** — a feature that is a near-copy of the label, or only knowable *after* the event you're predicting (e.g. `payment_received` when predicting churn).",
              "**Temporal leakage** — random splits on time-series data let the model train on the future and test on the past. Always split by time.",
              "**Group leakage** — the same patient, user, or document appears in both train and test. Split by **group**, not by row."
            ]
          }
        ]
      },
      {
        "heading": "Splitting the right way",
        "body": [
          {
            "type": "p",
            "text": "Fit every transform on **train only**, then apply it to validation and test. Pipelines exist precisely so you can't forget."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\n\npipe = Pipeline([\n    ('scale', StandardScaler()),    # learns mean/σ on train fold only\n    ('clf',   LogisticRegression()),\n])\npipe.fit(X_train, y_train)  # safe\nval_score  = pipe.score(X_val,  y_val)\ntest_score = pipe.score(X_test, y_test)  # touch ONCE"
          },
          {
            "type": "p",
            "text": "For time series, use a **rolling** or **expanding window** split (`TimeSeriesSplit`). For grouped data, use `GroupKFold` with the group id (user, patient, session)."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Test set used as a second validation set** — every time you tweak based on test score, you're overfitting to it. Lock it in a vault.",
              "**Class imbalance ignored** — use `stratify=y` so rare classes appear in every split.",
              "**Train/test distribution drift** — production data shifts. Periodically re-evaluate on a fresh holdout from recent traffic.",
              "**Suspiciously high scores** — 99% accuracy on a hard problem almost always means leakage. Investigate before you celebrate."
            ]
          },
          {
            "type": "p",
            "text": "Rule of thumb: if your validation score and test score disagree wildly, you have a leak or a drift. If they agree but production tanks, your splits didn't reflect reality."
          }
        ]
      }
    ]
  },
  "ml-data-overfitting": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a student who memorizes every past exam word-for-word.** They ace the practice tests because they've seen the exact questions before. Then the real exam shows up with rephrased problems and they freeze — they learned the *answer key*, not the *subject*."
          },
          {
            "type": "p",
            "text": "That's **overfitting**. Your model isn't learning the underlying pattern, it's memorizing the training set. **Generalization** is the opposite skill: doing well on data the model has never seen."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "Every model sits somewhere on a spectrum between two failure modes. On one end is **underfitting** — the model is too simple, misses the real structure, and is wrong everywhere. On the other end is **overfitting** — the model is too flexible and starts modeling the *noise* in your training data."
          },
          {
            "type": "p",
            "text": "The signature is gap. Training error keeps dropping while validation error plateaus or *climbs*. The model is getting better at the past and worse at the future."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "underfit:   train error HIGH   ·  val error HIGH\ngood fit:   train error LOW    ·  val error LOW\noverfit:    train error ~0     ·  val error HIGH   ← gap = generalization gap"
          }
        ]
      },
      {
        "heading": "How you detect it",
        "body": [
          {
            "type": "p",
            "text": "You hold data out. A **train/validation/test** split is non-negotiable — the model never sees val/test during fitting. The validation set tells you when to stop; the test set is touched *once*, at the end, for an honest number."
          },
          {
            "type": "p",
            "text": "Plot train vs validation loss over epochs. If they diverge, you're overfitting. The epoch where val loss bottoms out is roughly your **early stopping** point."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.model_selection import train_test_split\n\nX_tr, X_tmp, y_tr, y_tmp = train_test_split(X, y, test_size=0.3, random_state=42)\nX_val, X_test, y_val, y_test = train_test_split(X_tmp, y_tmp, test_size=0.5)\n\nfor epoch in range(epochs):\n    model.fit(X_tr, y_tr)\n    train_loss = loss(model.predict(X_tr), y_tr)\n    val_loss   = loss(model.predict(X_val), y_val)\n    # stop when val_loss stops improving for N epochs"
          }
        ]
      },
      {
        "heading": "How you fight it",
        "body": [
          {
            "type": "p",
            "text": "There are really only a few levers, and you pull them in roughly this order:"
          },
          {
            "type": "ul",
            "items": [
              "**More data** — the cleanest fix. Hard to memorize a million examples.",
              "**Simpler model** — fewer parameters, shallower trees, lower polynomial degree.",
              "**Regularization** — L1/L2 penalties, dropout, weight decay. Punish complexity.",
              "**Early stopping** — quit training when validation loss turns up.",
              "**Data augmentation** — flips, crops, noise. Synthetic variety the model can't memorize.",
              "**Cross-validation** — k-fold to get a stable estimate, not a lucky split."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "**Data leakage** is overfitting in disguise. If a feature secretly encodes the label (a customer ID that correlates with churn, a timestamp from the future), your validation score lies to you and production collapses."
          },
          {
            "type": "p",
            "text": "Also: **tuning on the test set**. Every time you peek at test accuracy and tweak the model, you're slowly overfitting to it. Keep that set sealed. If your val and test diverge wildly, your splits aren't representative — the world has shifted under you."
          }
        ]
      }
    ]
  },
  "ml-applied-clustering": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a librarian** dumped into a warehouse of unlabeled books. No genre stickers, no Dewey decimals, just stacks. She walks the aisles, notices some books smell like old paper and have leather spines, others are glossy paperbacks with neon covers, and a third pile is thin with crayon scribbles. She didn't *know* the categories existed — she discovered them by feeling for **natural groupings**."
          },
          {
            "type": "p",
            "text": "That's clustering. You hand the algorithm a pile of points with no labels, and it carves the pile into **groups that look like each other** and unlike everyone else."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "Clustering is **unsupervised** — no `y`, just `X`. The algorithm's job is to assign each row a cluster ID such that points in the same cluster are close in feature space and points in different clusters are far apart."
          },
          {
            "type": "p",
            "text": "The workhorse is **k-means**: you pick `k`, it finds `k` centroids, and each point joins its nearest centroid. **DBSCAN** finds dense blobs of any shape and labels stragglers as noise. **Hierarchical** builds a tree of merges so you can slice at any granularity."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.cluster import KMeans\nfrom sklearn.preprocessing import StandardScaler\n\nX_scaled = StandardScaler().fit_transform(X)\nkm = KMeans(n_clusters=4, n_init=10, random_state=42)\nlabels = km.fit_predict(X_scaled)\n\nprint(km.inertia_)  # within-cluster sum of squares\nprint(km.cluster_centers_)  # the 4 centroids"
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "k-means alternates two steps until centroids stop moving:"
          },
          {
            "type": "ol",
            "items": [
              "**Assign**: send each point to its nearest centroid (usually Euclidean distance).",
              "**Update**: move each centroid to the mean of its assigned points.",
              "Repeat until assignments don't change — or you hit max iterations."
            ]
          },
          {
            "type": "p",
            "text": "It's minimizing **within-cluster variance**, the sum of squared distances from each point to its centroid."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "objective:  J = ∑ᵢ ∑_{x ∈ Cᵢ}  ‖x − μᵢ‖²\nupdate:     μᵢ ← (1 / |Cᵢ|) · ∑_{x ∈ Cᵢ} x"
          }
        ]
      },
      {
        "heading": "Picking k",
        "body": [
          {
            "type": "p",
            "text": "You almost never know the right `k`. Two cheap tools to guess:"
          },
          {
            "type": "ul",
            "items": [
              "**Elbow method**: plot inertia vs `k`. Pick the bend where adding another cluster stops helping much.",
              "**Silhouette score**: measures how tight a point sits in its cluster versus the next-nearest one. Closer to `1` is better, near `0` means overlap, negative means misassigned."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Scale matters.** k-means uses distance, so a feature in dollars will drown out one in percent. Always `StandardScaler` first.",
              "**k-means assumes blobs.** It fails on moons, rings, and stringy shapes — reach for DBSCAN or spectral clustering there.",
              "**Random init bites.** Use `n_init=10` (or `k-means++`) so a bad starting seed doesn't lock you into a garbage local minimum.",
              "**Clusters are not classes.** The algorithm finds *structure*, not *meaning*. A human still has to look at each group and decide what it represents."
            ]
          }
        ]
      },
      {
        "heading": "When to use it",
        "body": [
          {
            "type": "p",
            "text": "Reach for clustering when you have data but no labels and want to **discover segments**: customer personas from purchase logs, anomaly buckets in server metrics, topic groups in embeddings, or pre-labeling work to bootstrap a supervised dataset."
          },
          {
            "type": "p",
            "text": "It's an **exploration tool**, not a prediction tool. The output is a hypothesis about structure — your next job is to validate it with domain knowledge or a downstream task."
          }
        ]
      }
    ]
  },
  "ml-prod-automl": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a chef who automates their own kitchen.** They write a script that tries every pan, every temperature, and every seasoning combo for a dish — then tastes the results and keeps the winner. You still pick the dish and judge the final plate, but the tedious permutation work runs overnight while you sleep."
          },
          {
            "type": "p",
            "text": "**AutoML** is that script for machine learning. It searches over models, features, and hyperparameters so you spend your time on the problem, not on babysitting `GridSearchCV`."
          }
        ]
      },
      {
        "heading": "What it actually automates",
        "body": [
          {
            "type": "p",
            "text": "AutoML is an umbrella term. Different tools automate different slices of the pipeline, and knowing which slice matters more than the brand name on the box."
          },
          {
            "type": "ul",
            "items": [
              "**Feature engineering** — encoding, scaling, imputation, interaction terms",
              "**Model selection** — trying `XGBoost`, `LightGBM`, MLPs, linear baselines",
              "**Hyperparameter tuning** — Bayesian search, Hyperband, evolutionary methods",
              "**Neural architecture search (NAS)** — designing the network topology itself",
              "**Ensembling** — stacking the top candidates into one stronger model"
            ]
          }
        ]
      },
      {
        "heading": "How it works under the hood",
        "body": [
          {
            "type": "p",
            "text": "Most AutoML systems run an outer **search loop** over a pipeline space and an inner **evaluation loop** that cross-validates each candidate. The search is guided — random sampling is a baseline, but **Bayesian optimization** and **bandit methods** like Hyperband converge faster by reallocating compute to promising configs."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from flaml import AutoML\n\nautoml = AutoML()\nautoml.fit(\n    X_train, y_train,\n    task=\"classification\",\n    metric=\"roc_auc\",\n    time_budget=600,  # seconds, not trials\n    estimator_list=[\"lgbm\", \"xgboost\", \"rf\"],\n    eval_method=\"cv\", n_splits=5,\n)\nprint(automl.best_estimator, automl.best_config)"
          },
          {
            "type": "p",
            "text": "Notice the budget is **time**, not iterations. Production AutoML treats compute as the scarce resource and tries to maximize validation score per GPU-hour."
          }
        ]
      },
      {
        "heading": "Where it fits in MLOps",
        "body": [
          {
            "type": "p",
            "text": "AutoML shines as a **strong baseline generator**. Wire it into your training pipeline so every new dataset gets a tuned `LightGBM` before any human touches it — that becomes the bar your custom model must beat."
          },
          {
            "type": "ul",
            "items": [
              "▶ **Retraining jobs** — re-run the search on fresh data weekly",
              "▶ **Tabular problems** — AutoML often matches expert-tuned models",
              "▶ **Rapid prototyping** — answer 'is this signal learnable?' in an hour",
              "▶ **Citizen data scientists** — give analysts a safe, audited on-ramp"
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "AutoML is a **search**, and searches overfit. If you tune on the same validation split a thousand times, the leaderboard score is optimistic — always hold out a final test set the search never sees."
          },
          {
            "type": "ul",
            "items": [
              "**Compute cost** — a 24-hour search on a big tabular set burns real money",
              "**Black-box outputs** — stacked ensembles are hard to explain to risk teams",
              "**Diminishing returns** — most gain happens in the first 10% of the budget",
              "**Weak on unstructured data** — for vision/NLP, fine-tuning a foundation model usually beats NAS from scratch",
              "**Garbage in, garbage out** — AutoML cannot fix a leaky target or mislabeled rows"
            ]
          },
          {
            "type": "p",
            "text": "Treat AutoML like a junior colleague: fast, tireless, and great at sweeping the obvious space — but you still own the problem framing, the data quality, and the decision to ship."
          }
        ]
      }
    ]
  },
  "ml-prod-managing": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a film production, not a software sprint.** ML projects look like coding work but behave like making a movie: a long pre-production phase of scouting and rewrites, a brutally expensive shoot where anything can go wrong, and a post-production pass where you discover the cut doesn't land and reshoot half of it. Treating that timeline like a normal feature ticket is why most ML projects miss their dates by a factor of three."
          }
        ]
      },
      {
        "heading": "Why ML projects break Agile",
        "body": [
          {
            "type": "p",
            "text": "Standard Agile assumes you can decompose the work upfront and estimate stories. ML work has **irreducible uncertainty**: you don't know if the signal exists in the data until you try, you don't know if the baseline will be beaten until you train, and you don't know if the lift survives production until you ship."
          },
          {
            "type": "ul",
            "items": [
              "**Spikes, not stories** — most ML work is research; estimates are guesses.",
              "**Data is the dependency** — half your sprints will be waiting on a pipeline owned by another team.",
              "**'Done' is fuzzy** — a model at 87% AUC isn't *done* the way a login page is done."
            ]
          }
        ]
      },
      {
        "heading": "Phase the project, not the sprint",
        "body": [
          {
            "type": "p",
            "text": "Run ML projects as **gated phases**, each with a clear kill criterion. Don't promote to the next phase unless the current one earned it."
          },
          {
            "type": "ol",
            "items": [
              "**Problem framing** — write the prediction target, the decision it drives, and the business metric. If you can't, stop.",
              "**Data audit** — does the signal exist? Cheap EDA and a dumb baseline before any modeling.",
              "**Offline modeling** — beat the baseline meaningfully on a frozen eval set. Time-boxed: 2-4 weeks.",
              "**Shadow / online eval** — run alongside production, compare on live traffic. No user impact yet.",
              "**Rollout** — gradual ramp behind a feature flag, with rollback ready.",
              "**Operate** — monitoring, retraining cadence, on-call ownership."
            ]
          }
        ]
      },
      {
        "heading": "Team shape",
        "body": [
          {
            "type": "p",
            "text": "The smallest viable ML team is a trio: a **DS/ML scientist** who owns the modeling, an **ML engineer** who owns the pipeline and serving, and a **product / domain partner** who owns the decision the model feeds. Missing any of the three and the project rots — usually the missing role is the domain partner, and the team ships a model nobody uses."
          },
          {
            "type": "ul",
            "items": [
              "**One backlog**, jointly owned. Don't split DS and engineering backlogs — they will drift.",
              "**Demo the model, not the metric** — show the actual predictions on real examples each week.",
              "**Pair DS with eng early** — productionization decisions made in week one cost 10× to undo in month six."
            ]
          }
        ]
      },
      {
        "heading": "Tracking what matters",
        "body": [
          {
            "type": "p",
            "text": "Velocity charts mean nothing here. Track **experiments per week**, **time from idea to offline result**, and **the gap between offline and online lift**. The last one is the honesty metric — a team whose models always look great offline and disappoint in production has a measurement problem, not a modeling problem."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "weekly review:\n  · experiments run        : 6\n  · beat baseline (offline): 1\n  · in shadow eval         : 2\n  · live, ramping          : 1\n  · offline → online Δ     : −18%   ← investigate"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Roadmaps with model accuracy as a deliverable** — you can't commit to a number you haven't measured yet.",
              "**Endless research** — set a kill date on every modeling spike before it starts.",
              "**Shipping the model and walking away** — the project isn't done at launch; it's done when someone owns retraining and monitoring.",
              "**Confusing 'we trained a model' with 'we changed a decision'** — only the second one has business value."
            ]
          }
        ]
      }
    ]
  },
  "ml-prod-fairness": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a bank loan officer** who has never met you, but decides your mortgage based on a thick dossier of patterns from past applicants. If that dossier overrepresents defaults from your zip code, you get a worse rate — not because of *you*, but because of who looked like you on paper. An ML model is that officer at scale: cheap, fast, and capable of repeating yesterday's prejudice a million times an hour."
          }
        ]
      },
      {
        "heading": "What fairness actually means",
        "body": [
          {
            "type": "p",
            "text": "There is no single definition. **Fairness is a family of mutually incompatible metrics**, and you have to pick which one matches your harm model."
          },
          {
            "type": "ul",
            "items": [
              "**Demographic parity** — positive rate is equal across groups: `P(ŷ=1 | A=a) = P(ŷ=1 | A=b)`",
              "**Equal opportunity** — true positive rates match: `P(ŷ=1 | y=1, A=a) = P(ŷ=1 | y=1, A=b)`",
              "**Equalized odds** — both TPR *and* FPR match across groups",
              "**Calibration** — among people scored *p*, the actual rate is *p* in every group"
            ]
          },
          {
            "type": "p",
            "text": "Chouldechova's **impossibility result**: if base rates differ between groups, you cannot satisfy calibration and equalized odds at the same time. Pick your trade-off deliberately."
          }
        ]
      },
      {
        "heading": "Where bias sneaks in",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Historical bias** — the labels themselves encode past discrimination (arrest ≠ crime)",
              "**Sampling bias** — minority groups have less data, so the model is less confident and more wrong there",
              "**Proxy features** — you drop `race`, but `zip_code + name + browser_language` reconstructs it",
              "**Feedback loops** — predictions shape future training data (predicted high-risk → more policing → more arrests → 'confirmed' high-risk)",
              "**Label leakage from biased annotators** — content moderators flagging dialect as 'toxic'"
            ]
          }
        ]
      },
      {
        "heading": "How to audit and mitigate",
        "body": [
          {
            "type": "p",
            "text": "Slice your evaluation by protected attribute *before* you ship. A model with 92% overall accuracy can be 97% on one group and 71% on another — and the aggregate metric will lie to you."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from fairlearn.metrics import MetricFrame, selection_rate\nfrom sklearn.metrics import recall_score\n\nmf = MetricFrame(\n    metrics={'tpr': recall_score, 'selection': selection_rate},\n    y_true=y_test,\n    y_pred=y_pred,\n    sensitive_features=X_test['gender'],\n)\nprint(mf.by_group)\nprint('TPR gap:', mf.difference()['tpr'])"
          },
          {
            "type": "p",
            "text": "Mitigation lives at three stages: **pre-processing** (reweight or resample training data), **in-processing** (add a fairness constraint to the loss), and **post-processing** (group-specific thresholds so TPRs match). Post-processing is often the cheapest and the most legally fraught — disparate thresholds are explicit group-based decisions."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Fairness through unawareness** — dropping the sensitive attribute does *not* make the model fair, it just makes the bias harder to measure",
              "**Subgroup blindness** — your model is fair on `gender` and fair on `race`, but catastrophic on Black women (Buolamwini & Gebru, 2018)",
              "**Threshold drift** — you tuned thresholds for parity in May; the population shifted in August and parity is gone",
              "**Optimizing one metric** — equalizing TPR can tank precision; document the trade-off and get sign-off from someone non-technical",
              "**Treating fairness as a model problem** — sometimes the right fix is not shipping the model at all"
            ]
          }
        ]
      }
    ]
  },
  "ml-prod-responsible-ai": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a pharmacist** filling prescriptions. The pills work, but if she ignores allergies, dosages for kids, or who can afford the copay, people get hurt. Her job isn't just *can this drug work* — it's *should this patient get it, and what happens when it goes wrong*."
          },
          {
            "type": "p",
            "text": "Your model is the pill. **Responsible AI** is the pharmacist's checklist: who is harmed, who is excluded, who is accountable, and how do you find out before the lawsuit."
          }
        ]
      },
      {
        "heading": "The four pillars",
        "body": [
          {
            "type": "p",
            "text": "Responsible AI isn't one metric. It's a stack of concerns you bolt onto the normal training loop."
          },
          {
            "type": "ul",
            "items": [
              "**Fairness** — does the model perform equally across protected groups (race, gender, age, geography)?",
              "**Transparency** — can you explain *why* a specific prediction happened (SHAP, LIME, attention)?",
              "**Privacy** — are you leaking training data via memorization or membership inference?",
              "**Accountability** — when the model is wrong, who owns the harm and how is it appealed?"
            ]
          }
        ]
      },
      {
        "heading": "How it works in practice",
        "body": [
          {
            "type": "p",
            "text": "You measure subgroup performance *before* shipping. A 92% overall accuracy can hide a 60% accuracy on one demographic — that's the disparity that ends up on the news."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from fairlearn.metrics import MetricFrame\nfrom sklearn.metrics import false_positive_rate, selection_rate\n\nmf = MetricFrame(\n    metrics={\n        'fpr': false_positive_rate,\n        'selection_rate': selection_rate,\n    },\n    y_true=y_test,\n    y_pred=y_pred,\n    sensitive_features=df_test['gender'],\n)\n\nprint(mf.by_group)\nprint('disparity:', mf.difference(method='between_groups'))\n# fail the build if disparity > 0.1"
          },
          {
            "type": "p",
            "text": "Pair this with a **model card** — a short doc shipped beside the weights describing intended use, training data, known failure modes, and evaluation by subgroup. Treat it like a README for the model."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Proxy features** — removing `race` doesn't help if `zip_code` encodes it. Audit correlations, don't just drop columns.",
              "**Fairness-accuracy tradeoffs** — equalizing groups often costs overall accuracy. That's a *product* decision, not an ML one. Surface it.",
              "**Privacy leakage** — LLMs memorize PII from training data. Use **differential privacy** noise (ε ≤ 1) or scrub before training.",
              "**Drift in fairness** — a model that was fair at launch can skew as the population shifts. Monitor subgroup metrics in production, not just AUC."
            ]
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Regulators are catching up: the **EU AI Act**, NYC's hiring-algorithm audits, and FTC enforcement actions all assume you can produce evidence of fairness testing and human oversight. \"The model decided\" is no longer a legal defense."
          },
          {
            "type": "p",
            "text": "Bake it into the pipeline early. Fairness checks in CI, model cards in the repo, an appeals path for users, and a kill switch for the deploy. **Responsible AI is an SRE discipline** — you don't bolt it on after the incident, you instrument for it before launch."
          }
        ]
      }
    ]
  },
  // ML (mleng) stubs
  "sd-feature-store-vs-serve": {
    "sections": [
      {
        "heading": "The two-kitchen problem",
        "body": [
          {
            "type": "p",
            "text": "**Picture two kitchens cooking the same dish.** One is the *training kitchen* — a quiet warehouse with all ingredients pre-chopped in big bins, where the chef has hours to assemble a batch. The other is the *serving kitchen* — a food truck at lunch rush, 80 ms per order, ingredients arriving live off a delivery truck. Same recipe, wildly different conditions."
          },
          {
            "type": "p",
            "text": "Your features are the chopped ingredients. The question every MLOps team faces: do you maintain **one bin** that both kitchens read from, or do you let each kitchen chop on demand and pray they chop the same way?"
          }
        ]
      },
      {
        "heading": "The naïve path — compute features at request time",
        "body": [
          {
            "type": "p",
            "text": "Easiest to ship: when a prediction request comes in, look up the raw data, run the feature code, hand the vector to the model. No new infra. The catch is that any feature touching history — `user_purchases_last_30d`, `merchant_avg_ticket`, `embedding_of_last_5_searches` — now needs a low-latency aggregation at request time. Your p99 explodes the first time someone has 50k events."
          },
          {
            "type": "p",
            "text": "Worse, the feature code lives in two places: a `pandas` script for training, a Python service for serving. They drift. Welcome to training/serving skew — a problem so common it has its own SD insight."
          }
        ]
      },
      {
        "heading": "The feature store — one bin, two doors",
        "body": [
          {
            "type": "p",
            "text": "A **feature store** centralizes feature definitions and serves them through two interfaces: an **offline store** (warehouse table, Parquet on S3) for training, and an **online store** (Redis, DynamoDB, Bigtable) for serving. The same transformation pipeline writes both, so the value of `user_avg_order_value` at training time is byte-identical to what serving reads."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from feast import FeatureStore\nfs = FeatureStore(repo_path=\".\")\n\n# Training: pull a point-in-time correct historical join\ntrain_df = fs.get_historical_features(\n    entity_df=labels_df,  # has user_id + event_ts\n    features=[\"user_stats:avg_order_value_30d\",\n              \"merchant_stats:fraud_rate_7d\"],\n).to_df()\n\n# Serving: same feature names, sub-10ms lookup\nvec = fs.get_online_features(\n    features=[\"user_stats:avg_order_value_30d\",\n              \"merchant_stats:fraud_rate_7d\"],\n    entity_rows=[{\"user_id\": 42, \"merchant_id\": 17}],\n).to_dict()"
          },
          {
            "type": "p",
            "text": "The killer feature isn't the cache — it's **point-in-time correctness**. The offline store knows that on `event_ts = 2026-01-15`, the user's 30-day average was X, *not* whatever it is today. That single capability prevents an entire family of label-leakage bugs."
          }
        ]
      },
      {
        "heading": "When you actually need one",
        "body": [
          {
            "type": "ul",
            "items": [
              "You have **≥ 3 models** sharing features. Reuse is the real ROI — one team's `user_ltv_score` becomes another team's input.",
              "Your features are **temporal aggregations** (windowed counts, rolling means). Computing these at request time is expensive and error-prone.",
              "You need **real-time freshness** — sub-minute updates from streaming sources. Without an online store you're stuck batch-refreshing.",
              "You're hitting **point-in-time bugs** during backtesting. Symptom: offline AUC of 0.92, online AUC of 0.71."
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "A feature store is **not** a database, a cache, or a magic AI accelerator. It's a *contract* — one place where the definition of every feature lives, with a guarantee that training and serving see the same value. If you have one model and no historical features, you don't need it. Once you have three, you'll wish you'd built it on day one."
          }
        ]
      }
    ]
  },
  "sd-online-vs-batch-inference": {
    "sections": [
      {
        "heading": "The pizza-shop choice",
        "body": [
          {
            "type": "p",
            "text": "**Imagine a pizza shop deciding between two business models.** Model A: take orders, make each pizza from scratch, deliver hot in 30 minutes. Model B: pre-bake a thousand frozen pizzas overnight, sell them all day, customer heats one up at home. Same product, completely different operations."
          },
          {
            "type": "p",
            "text": "Online inference is model A. Batch inference is model B. The mistake junior engineers make is assuming online is *better* — fresher, more responsive — when actually it's just *one tradeoff slider* on a triangle of latency, cost, and freshness."
          }
        ]
      },
      {
        "heading": "The three regimes",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Batch (offline)** — predict for every user once a day, write results to a table, serve from the table. Cheap (one GPU job, no idle hardware), simple to debug, but predictions are stale by the time they're read.",
              "**Online (synchronous)** — model behind a REST/gRPC endpoint. p99 latency budget of 50-200 ms. Fresh inputs, fresh outputs, but you pay for capacity 24/7 and any model-quality regression is immediately user-visible.",
              "**Streaming (async)** — events flow through a pipeline (Kafka → model → sink). Latency in seconds, not milliseconds. Good for risk scoring, anomaly detection, anything where 'eventually' is fine."
            ]
          }
        ]
      },
      {
        "heading": "Picking by request shape",
        "body": [
          {
            "type": "p",
            "text": "Ask one question first: **does the prediction depend on inputs that exist before the user shows up?** If yes, batch wins on cost. Spotify's Discover Weekly is the canonical example — your taste profile is stable enough that overnight scoring is fine, and serving from a table is essentially free."
          },
          {
            "type": "p",
            "text": "If the prediction needs request-time context — search query, current cart contents, sensor reading from this second — you're forced online. The bill follows: GPU instances, autoscaling, request-level monitoring, the works."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Batch — runs at 2 AM, writes a table\n@dataclass\nclass DailyScoring:\n    def run(self, run_date):\n        users = warehouse.read(\"active_users\", date=run_date)\n        scores = model.predict(users.features)  # one big GPU job\n        warehouse.write(\"recs.daily\", scores)  # served by SELECT\n\n# Online — fastapi endpoint, p99 budget 80 ms\n@app.post(\"/recommend\")\ndef recommend(req: Request):\n    feats = feature_store.get_online(req.user_id)  # <5 ms\n    scores = model.predict(feats)  # <40 ms\n    return rank_and_diversify(scores, req.context)    # <20 ms"
          }
        ]
      },
      {
        "heading": "Hybrid is usually the right answer",
        "body": [
          {
            "type": "p",
            "text": "Production systems rarely pick one. The pattern: **batch-precompute the expensive part, online-combine with request context.** Netflix scores a few thousand candidates per user overnight (batch), then the front-end re-ranks the top hundred at request time using current device, time of day, and partial-watch state (online). You pay for the GPU at 2 AM and serve from a hot cache at noon."
          },
          {
            "type": "p",
            "text": "This is also how you defuse the latency-vs-freshness fight. The slow, expensive part runs offline; the fast, cheap part runs online; the user sees both as one snappy response."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Online inference is not a feature you add for prestige — it's a **cost choice** you make when the request itself carries information the model needs. If your feature set is mostly user history, batch first, online second. The teams who skip this question end up running a 50-GPU autoscaling fleet to compute scores for users who haven't logged in this month."
          }
        ]
      }
    ]
  },
  "sd-training-serving-skew": {
    "sections": [
      {
        "heading": "The silent regression",
        "body": [
          {
            "type": "p",
            "text": "**Imagine training a chef in a quiet test kitchen with pre-weighed ingredients, then shipping them to a chaotic restaurant where the scale reads in ounces, not grams, and the parsley is from a different farm.** The dishes will be subtly wrong. The chef hasn't changed. The recipe hasn't changed. The *inputs* have."
          },
          {
            "type": "p",
            "text": "**Training/serving skew** is when the data your model sees at inference doesn't match the data it was trained on — not because of drift, but because the *code paths* producing features differ between offline and online. It's the most common reason an offline AUC of 0.92 ships as an online AUC of 0.71."
          }
        ]
      },
      {
        "heading": "Where it sneaks in",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Two implementations.** Training uses pandas; serving uses a Python microservice. `df.fillna(mean)` becomes `if x is None: x = 0.0`. The mean was 47.",
              "**Time-zone bugs.** Training joins on UTC dates; serving joins on local time. Every prediction near midnight is shifted by one day.",
              "**Label leakage in training only.** Your training join accidentally uses *current* user balance, not balance-at-event-time. Serving uses live balance correctly. The model relies on a feature that's now wrong.",
              "**Type coercion.** Training reads a CSV with `dtype=str`; serving deserializes JSON with `int`. `\"007\"` and `7` hash to different one-hot buckets.",
              "**Default values.** Training imputes missing with the column median; serving sends `null` straight through. Model now sees a value it never saw during training."
            ]
          }
        ]
      },
      {
        "heading": "Why your offline eval misses it",
        "body": [
          {
            "type": "p",
            "text": "Offline evaluation reads the *training* feature pipeline by definition. The skew lives at the seam between two codebases that nobody runs end-to-end until traffic hits prod. Your validation set is happy. Your test set is happy. Your shadow deploy on a 1% slice shows the regression — if you're lucky."
          },
          {
            "type": "p",
            "text": "This is part of why drift detection is hard: a skew bug *looks* like input drift in the monitoring dashboard. The feature distributions shift on day one of deploy, you blame the world, and meanwhile the bug is fifteen lines of feature code that handle nulls differently."
          }
        ]
      },
      {
        "heading": "The fix — share the transform",
        "body": [
          {
            "type": "p",
            "text": "**One implementation, two callers.** Write feature transformations as a pure function, package it, and have both the training pipeline and the serving service import the same module. A feature store enforces this by construction; without one, discipline does."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# features/transforms.py — single source of truth\ndef compute_user_features(events: pl.DataFrame, as_of: datetime) -> dict:\n    \"\"\"Pure function. No I/O. No randomness. Same input → same output.\"\"\"\n    window = events.filter(pl.col(\"ts\") < as_of)\n    return {\n        \"user_purchases_30d\": window.filter(\n            pl.col(\"ts\") > as_of - timedelta(days=30)\n        ).height,\n        \"user_avg_basket\":    window[\"amount\"].mean() or 0.0,  # one defined null policy\n    }\n\n# training_pipeline.py\nfeatures = events.groupby(\"user_id\").apply(\n    lambda g: compute_user_features(g, g[\"label_ts\"].max())\n)\n\n# serving_service.py\n@app.post(\"/predict\")\ndef predict(req):\n    feats = compute_user_features(\n        events=load_user_events(req.user_id),\n        as_of=datetime.utcnow(),\n    )\n    return model.predict(feats)"
          },
          {
            "type": "p",
            "text": "Pair this with a **skew detector**: log a random sample of serving features back to the warehouse, re-compute the training-side version on those exact inputs, and alert when the distributions diverge by more than ε. Continuous proof that the seam still holds."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Skew is not a model problem; it's a **software engineering** problem. The model is doing exactly what it was trained to do — somebody else changed the inputs. The fix is the same as for any 'two implementations of the same thing' bug: collapse it to one. Then continuously verify the one is the one."
          }
        ]
      }
    ]
  },
  "sd-model-registry-source-of-truth": {
    "sections": [
      {
        "heading": "The pickle-on-someone's-laptop problem",
        "body": [
          {
            "type": "p",
            "text": "**Picture an airline that flies planes for a year, then asks a mechanic which engine is in tail number N4287.** The answer comes back: 'Pretty sure it's the one Bob installed in March. Maybe. The logbook is on Bob's laptop.' That's most ML teams before they have a registry."
          },
          {
            "type": "p",
            "text": "Models in production are physical things that fly. Somebody trained one, somebody else loaded it, somebody else is about to retrain it. Without a single source of truth, you cannot answer the only question that matters during an incident: **which model, trained on what data, with what code, is serving this request right now?**"
          }
        ]
      },
      {
        "heading": "What a registry actually stores",
        "body": [
          {
            "type": "p",
            "text": "A **model registry** (MLflow, SageMaker, Vertex AI, Weights & Biases) is a versioned, queryable index of every model your team has ever shipped. For each version it records:"
          },
          {
            "type": "ul",
            "items": [
              "**The artifact** — the serialized weights/graph, hashed and immutable.",
              "**Lineage** — training data snapshot ID, feature definitions, code commit, hyperparameters, library versions.",
              "**Metrics** — offline scores at training time on a frozen eval set.",
              "**Stage** — `staging`, `production`, `archived`. The thing your serving layer queries.",
              "**Approvals** — who promoted it, when, with what evidence."
            ]
          },
          {
            "type": "p",
            "text": "Crucially, the registry is *the* source of truth. Your inference service doesn't read a path on S3 — it asks the registry for 'the current production version of `fraud-scorer-v2`' and gets back a URI. Promotion is a registry call, not a deploy."
          }
        ]
      },
      {
        "heading": "Why promotion-by-registry beats promotion-by-deploy",
        "body": [
          {
            "type": "p",
            "text": "The old pattern: train a model, package it into a Docker image, deploy the image. New model = new image = full release cycle. Slow, and the artifact gets tangled with serving code."
          },
          {
            "type": "p",
            "text": "The registry pattern: the serving image is stable. Models are pulled at startup (or hot-reloaded) by querying the registry. Promoting a new model to production is a single API call that re-targets the alias. Rolling back is the inverse call. Your release surface shrinks dramatically."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import mlflow\nfrom mlflow.tracking import MlflowClient\n\nclient = MlflowClient()\n\n# Promote v17 to production after staging eval passes\nclient.transition_model_version_stage(\n    name=\"fraud-scorer\",\n    version=17,\n    stage=\"Production\",\n    archive_existing_versions=True,   # auto-demote v16 to Archived\n)\n\n# Serving side — pinned by stage, not by path\nmodel = mlflow.pyfunc.load_model(\"models:/fraud-scorer/Production\")\n# Tomorrow's promotion: zero deploy. Worker re-loads on next refresh.\n\n# Roll back in one line\nclient.transition_model_version_stage(\n    name=\"fraud-scorer\", version=16, stage=\"Production\",\n    archive_existing_versions=True,\n)"
          }
        ]
      },
      {
        "heading": "The audit story",
        "body": [
          {
            "type": "p",
            "text": "Six months into running a credit model, regulators ask: 'On April 12, what model decided to deny applicant 8847, and what features did it see?' Without a registry that question takes a week. With one, it's two queries — one to the registry for the production version on that date, one to the feature store for the served vector. Lineage is the boring superpower."
          },
          {
            "type": "p",
            "text": "The same lineage data answers internal questions too: 'Did the November regression coincide with a model promotion?' becomes a join, not an archaeology dig."
          }
        ]
      },
      {
        "heading": "What this is *not*",
        "body": [
          {
            "type": "p",
            "text": "A model registry is **not** a model store, a deployment system, or a monitoring tool. It's an *index*. The artifacts can live in S3, the deploys can run in K8s, the metrics can flow to Datadog — the registry just remembers which version of each is which, who blessed it, and how to fetch it. Treat it as the equivalent of `git` for trained models, and design every other piece of your ML platform to consult it instead of duplicating its data."
          }
        ]
      }
    ]
  },
  "mlops-serving-apis": {
    "sections": [
      {
        "heading": "The request lifecycle",
        "body": [
          {
            "type": "p",
            "text": "**Serving a model is just a web service that happens to load weights.** The client sends features, the server runs `predict()`, and a JSON or protobuf payload comes back. Everything hard is in the layers around that — load balancing, caching, and not blowing the latency budget."
          },
          {
            "type": "p",
            "text": "Think of it like a drive-through. The order window (load balancer) routes you to the next free station (model server), the cook (model) does the work, and a warming lamp (cache) holds frequent items so you don't re-cook every time."
          },
          {
            "type": "diagram",
            "title": "Serving stack — one prediction's journey",
            "subtitle": "CLIENT TO PREDICTION IN UNDER 100MS",
            "height": 240,
            "nodes": [
              { "id": "client",  "label": "client",       "subtitle": "APP / SDK",       "accent": "water", "x": 0.06, "y": 0.5 },
              { "id": "lb",      "label": "load balancer", "subtitle": "ROUND ROBIN",     "accent": "amber", "x": 0.28, "y": 0.5 },
              { "id": "cache",   "label": "cache",        "subtitle": "REDIS · TTL 60S",  "accent": "sky",   "x": 0.50, "y": 0.18 },
              { "id": "server",  "label": "model server", "subtitle": "FASTAPI POOL",     "accent": "fire",  "x": 0.72, "y": 0.5 },
              { "id": "store",   "label": "model store",  "subtitle": "S3 ARTIFACT",      "accent": "earth", "x": 0.94, "y": 0.5 }
            ],
            "edges": [
              { "from": "client", "to": "lb",     "kind": "dashed", "label": "POST" },
              { "from": "lb",     "to": "cache",  "kind": "dashed", "label": "lookup" },
              { "from": "lb",     "to": "server", "kind": "dashed", "label": "if miss" },
              { "from": "server", "to": "store",  "kind": "dashed", "label": "cold load" }
            ]
          }
        ]
      },
      {
        "heading": "REST vs gRPC vs the rest",
        "body": [
          {
            "type": "p",
            "text": "**Protocol choice is a latency-vs-debuggability trade.** REST + JSON is universal, browser-friendly, and easy to curl. gRPC + protobuf is faster on the wire and typed end-to-end, but you can't paste it into Postman without tooling."
          },
          {
            "type": "table",
            "headers": ["Protocol", "Best for", "Watch out"],
            "rows": [
              ["REST + JSON (text)", "Public APIs, browser clients", "5-10x bigger payloads"],
              ["gRPC + proto (binary)", "Internal microservices", "Harder to debug, needs codegen"],
              ["WebSocket (streaming)", "Token-by-token LLM output", "Stateful, harder to scale"],
              ["Batch S3 → S3 (files)", "Offline scoring jobs", "Latency measured in minutes"]
            ],
            "align": ["left", "left", "left"]
          },
          {
            "type": "p",
            "text": "**Latency budgets are tiered.** P50 is what most users feel. P95 is your slow tail. P99 is what your on-call sees at 3am. Pick targets *before* you pick a framework."
          },
          {
            "type": "table",
            "headers": ["Use case", "P50 target", "P95 target", "P99 target"],
            "rows": [
              ["Ad ranking", "10 ms", "30 ms", "80 ms"],
              ["Search rerank", "50 ms", "150 ms", "400 ms"],
              ["LLM chat (TTFT)", "300 ms", "800 ms", "2 s"],
              ["Batch scoring", "n/a", "n/a", "minutes"]
            ],
            "align": ["left", "center", "center", "center"]
          }
        ]
      },
      {
        "heading": "Frameworks and the cold-start trap",
        "body": [
          {
            "type": "p",
            "text": "**FastAPI is the Python default** because it's async, has Pydantic baked in, and feels like Flask without the footguns. TorchServe, TF Serving, and Triton are heavier — they ship batching, model versioning, and GPU scheduling out of the box."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from fastapi import FastAPI  # async-first web framework\nfrom pydantic import BaseModel  # request/response validation\nimport joblib  # load sklearn / xgboost artifact\n\napp = FastAPI()\nmodel = joblib.load(\"model.pkl\")  # load ONCE at boot — not per request\n\nclass Features(BaseModel):  # schema = your input contract\n    age: int  # required\n    income: float  # required\n\n@app.post(\"/predict\")\nasync def predict(x: Features):  # async lets the event loop multiplex\n    score = model.predict([[x.age, x.income]])[0]  # blocking call inside async — OK for short CPU work\n    return {\"score\": float(score)}  # FastAPI auto-serializes to JSON"
          },
          {
            "type": "pros-cons",
            "goodLabel": "Good for",
            "watchLabel": "Watch out for",
            "good": [
              "Load model in module scope so it's hot on every request",
              "Pool of N workers (`gunicorn -w 4`) — one model copy per worker",
              "Cache identical requests by feature hash — 30% hit rate is realistic",
              "Pre-warm replicas before traffic shifts (canary, autoscale)"
            ],
            "watch": [
              "Cold start — first request after deploy loads weights from S3, can take 30s+",
              "Loading the model inside the handler — every request re-reads from disk",
              "Sync framework + GPU model — one request blocks the entire process",
              "Forgetting batch endpoints — 100 single calls cost 100x more than one batch of 100"
            ]
          }
        ]
      },
      {
        "heading": "Try it",
        "body": [
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Wire a fake `predict()` into a FastAPI route. Inspect the response payload.",
            "varName": "response",
            "starter": "from fastapi.testclient import TestClient  # in-process HTTP client\nfrom fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\ndef predict(features):  # stand-in for a real model.predict()\n    return sum(features) * 0.1  # toy scoring rule\n\nclass Req(BaseModel):  # input schema\n    features: list[float]  # required list of floats\n\n@app.post(\"/score\")\ndef score(r: Req):  # FastAPI validates r against Req\n    return {\"score\": predict(r.features)}  # JSON response\n\nclient = TestClient(app)  # spins up the app in-memory\nresponse = client.post(\"/score\", json={\"features\": [1.0, 2.0, 3.0]}).json()\nprint(response)  # {'score': 0.6}\n",
            "hint": "Change the `features` list or the predict() formula. TestClient skips the network — same code path, no server to boot."
          },
          {
            "type": "quote",
            "text": "The model is 10% of the system. The other 90% is the wire between the user and the GPU.",
            "cite": "every ML platform postmortem ever"
          }
        ]
      }
    ]
  },
  "mlops-api-contracts": {
    "sections": [
      {
        "heading": "Schemas are the cheapest defense you have",
        "body": [
          {
            "type": "p",
            "text": "**Your API contract is a promise.** Inputs come in with these names and types; outputs come back with those. Validate it at the edge with Pydantic or JSON Schema and 80% of the weird production bugs evaporate before they reach your model."
          },
          {
            "type": "p",
            "text": "Bad inputs are the canary for upstream drift. If a feature suddenly arrives as a string instead of a float, that's not a model problem — that's a data problem you can catch at the door."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from pydantic import BaseModel, Field, field_validator  # runtime validation\nfrom typing import Optional\n\nclass PredictRequest(BaseModel):  # the contract, in code\n    user_id: str = Field(..., min_length=1)  # required, non-empty\n    age: int = Field(..., ge=0, le=120)  # bounded — catches sentinel -1 values\n    country: str = Field(default=\"US\")  # default keeps old clients working\n    income: Optional[float] = None  # optional — model handles None gracefully\n\n    @field_validator(\"country\")  # custom rule, runs after type check\n    @classmethod\n    def upper(cls, v: str) -> str:\n        return v.upper()  # normalize at the boundary, not in the model\n\nclass PredictResponse(BaseModel):\n    score: float = Field(..., ge=0.0, le=1.0)  # outputs deserve schemas too\n    model_version: str  # always echo which model answered\n    request_id: str  # so the client can correlate logs"
          }
        ]
      },
      {
        "heading": "Versioning: model vs API are not the same axis",
        "body": [
          {
            "type": "p",
            "text": "**The model changes daily. The API changes quarterly.** Conflating the two means every retrain breaks your clients. Decouple them — bump `model_version` in the response body, bump `/v1` → `/v2` only when the *shape* of the contract changes."
          },
          {
            "type": "table",
            "headers": ["Change", "Bump API?", "Bump model?"],
            "rows": [
              ["Retrained on fresh data", "no", "yes"],
              ["Added optional feature", "no", "yes"],
              ["Renamed a required field — **breaking**", "yes (v2)", "yes"],
              ["Removed a response key — **breaking**", "yes (v2)", "no"]
            ],
            "align": ["left", "center", "center"]
          },
          {
            "type": "p",
            "text": "**Batch and realtime want different contracts.** Batch jobs see nulls all the time — a backfill row missing yesterday's session count is normal. Realtime should refuse nulls loudly, because a missing feature at serve time means an upstream service is down."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Good for",
            "watchLabel": "Watch out for",
            "good": [
              "Echo `model_version` and `request_id` in every response — debug-on-demand",
              "Defaults for new fields so old clients keep working without redeploy",
              "Reject obviously bad inputs at the schema layer (age = -1, score > 1.0)",
              "Graceful degradation — return a fallback prediction + `degraded: true` when a feature is missing"
            ],
            "watch": [
              "Silently coercing strings to floats — masks real drift",
              "Letting nulls flow into the model — NaN propagates, predictions go to garbage",
              "One endpoint serving batch and realtime with the same nullability rules",
              "Skipping output validation — your model returning `NaN` then crashing the client"
            ]
          }
        ]
      },
      {
        "heading": "Sketch the schema",
        "body": [
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Mock a request/response pair. Add an optional field, default it, and version both layers.",
            "starter": "{\n  \"request\": {\n    \"user_id\": \"u_8421\",\n    \"age\": 34,\n    \"country\": \"US\",\n    \"income\": 72000.0\n  },\n  \"response\": {\n    \"score\": 0.73,\n    \"model_version\": \"churn-v4.2.1\",\n    \"api_version\": \"v1\",\n    \"request_id\": \"r_2026-06-01_8421\",\n    \"degraded\": false\n  }\n}\n",
            "hint": "Try removing `income` from the request — your contract should default it or mark `degraded: true` in the response, not crash."
          },
          {
            "type": "quote",
            "text": "Validate at the door, version on purpose, and always tell the client which model answered.",
            "cite": "the three rules of ML contracts"
          }
        ]
      }
    ]
  },
  "mlops-cdc-semantics": {
    "sections": [
      {
        "heading": "Why CDC, and why semantics matter",
        "body": [
          {
            "type": "p",
            "text": "**Change data capture (CDC)** is how your ML pipeline notices that a row in Postgres just changed — without polling. A tool like **Debezium** tails the database's binlog, turns each commit into a Kafka event, and your downstream features stay seconds behind reality instead of nightly batches behind."
          },
          {
            "type": "p",
            "text": "The catch is that every event is delivered with one of three guarantees: **at-most-once, at-least-once, or exactly-once**. Pick the wrong one and you'll either drop predictions or double-count revenue."
          },
          {
            "type": "p",
            "text": "This lesson maps the CDC pipeline, compares the three semantics honestly, weighs CDC against the ETL it replaces, and shows the one piece of code that makes the whole thing safe: an **idempotent consumer**."
          }
        ]
      },
      {
        "heading": "**Sequence** of a single change",
        "body": [
          {
            "type": "p",
            "text": "A user updates a row. The DB commits, the binlog gets a new entry, the connector picks it up, Kafka durably stores it, the consumer reads it. Each arrow is a place where the message can be retried — which is exactly why semantics get interesting."
          },
          {
            "type": "sequence",
            "title": "CDC event flow: DB → connector → Kafka → consumer",
            "caption": "Every hop is a potential retry boundary — duplicates live in those gaps.",
            "actors": [
              { "id": "db",  "label": "Postgres",  "accent": "earth" },
              { "id": "cdc", "label": "Debezium",  "accent": "amber" },
              { "id": "kafka","label": "Kafka",    "accent": "sky" },
              { "id": "cons","label": "Consumer",  "accent": "fire" }
            ],
            "events": [
              { "from": "db",   "to": "db",    "label": "UPDATE users SET tier=…", "note": "commit + binlog write" },
              { "from": "db",   "to": "cdc",   "label": "binlog tail",             "note": "logical replication slot" },
              { "from": "cdc",  "to": "kafka", "label": "Produce(key=user_id)",    "note": "ordered per key" },
              { "from": "kafka","to": "cons",  "label": "Poll batch" },
              { "from": "cons", "to": "kafka", "label": "Commit offset",           "note": "after side-effect", "dashed": true }
            ]
          },
          {
            "type": "p",
            "text": "Notice the **commit-offset-after-side-effect** arrow. If the consumer crashes before that commit, Kafka re-delivers the same event — that's at-least-once in action."
          }
        ]
      },
      {
        "heading": "**Three** delivery semantics, side by side",
        "body": [
          {
            "type": "p",
            "text": "These three terms get thrown around as if they were interchangeable knobs. They aren't. Each one trades a different thing: data loss, duplicates, or throughput."
          },
          {
            "type": "compare",
            "title": "At-most-once vs at-least-once vs exactly-once",
            "caption": "Two of these are real engineering trade-offs. One is mostly marketing.",
            "axes": ["Can drop messages?", "Can duplicate?", "Throughput cost", "Where it fits"],
            "left":  { "label": "At-most-once",  "accent": "water", "values": ["Yes — fire and forget", "No", "Cheapest", "Metrics you can lose"] },
            "right": { "label": "At-least-once", "accent": "fire",  "values": ["No", "Yes — retries on failure", "Modest", "Default for CDC + Kafka"] }
          },
          {
            "type": "p",
            "text": "**Exactly-once** is the third option — and the honest answer is *kind of*. Kafka's exactly-once is exactly-once **within Kafka** (transactional producer + idempotent broker + consumer in a read-process-write loop). The moment your consumer writes to an external system — Postgres, S3, a metrics store — you're back to at-least-once unless that sink is idempotent."
          },
          {
            "type": "pros-cons",
            "goodLabel": "What exactly-once actually buys you",
            "watchLabel": "What it doesn't",
            "good": [
              "Kafka-to-Kafka pipelines (Streams, Flink) genuinely dedupe",
              "Transactional offsets + writes in the same atomic commit",
              "No double-aggregation inside the stream processor"
            ],
            "watch": [
              "Side effects outside the broker — emails, charges, model updates",
              "External sinks without primary keys or upserts",
              "Throughput drops 20-40% from the transactional protocol",
              "The marketing claim — read it as 'effectively-once if you design for it'"
            ]
          }
        ]
      },
      {
        "heading": "**CDC** vs the nightly ETL it replaces",
        "body": [
          {
            "type": "p",
            "text": "Before you pick CDC, be honest about what you're trading. ETL is boring and reliable. CDC is fast and operationally noisy. For ML features that need to be fresh, CDC wins; for monthly reports, it's overkill."
          },
          {
            "type": "pros-cons",
            "goodLabel": "CDC wins when",
            "watchLabel": "ETL still wins when",
            "good": [
              "Features need to be **seconds-fresh** — fraud, recommendations, churn",
              "Source DB can't take repeated full-table scans",
              "You need an **event log** for replay, debugging, or audit",
              "Multiple consumers want the same change stream"
            ],
            "watch": [
              "Daily or weekly aggregates — overkill, and you'll still build a batch job",
              "Schema changes are frequent — CDC pipelines break loudly on every ALTER",
              "Team has no Kafka operator on call — connector outages get expensive",
              "Source DB doesn't expose a usable WAL/binlog (older MySQL, some managed RDS configs)"
            ]
          }
        ]
      },
      {
        "heading": "**Idempotent** consumer — the one trick that makes at-least-once safe",
        "body": [
          {
            "type": "p",
            "text": "Since at-least-once is what you'll actually deploy, your consumer must be safe to run **twice on the same message** and produce the same final state. That's idempotency — and it's the difference between a robust pipeline and a 3 a.m. page."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from confluent_kafka import Consumer  # at-least-once by default\nimport psycopg  # Postgres driver — the sink\n\nc = Consumer({\n    \"bootstrap.servers\": \"kafka:9092\",\n    \"group.id\": \"feature-updater\",  # group = parallel + offset tracking\n    \"enable.auto.commit\": False,  # we commit only AFTER the write succeeds\n})\nc.subscribe([\"users.cdc\"])\n\nwhile True:\n    msg = c.poll(1.0)  # blocking poll, returns one record\n    if msg is None or msg.error(): continue  # skip empty polls / transient errors\n    evt = msg.value()  # {\"user_id\": 42, \"tier\": \"gold\", \"lsn\": 99421}\n\n    with psycopg.connect(DSN) as conn, conn.cursor() as cur:\n        cur.execute(  # UPSERT — same row twice = same final state\n            \"INSERT INTO features (user_id, tier, src_lsn) \"\n            \"VALUES (%s, %s, %s) \"\n            \"ON CONFLICT (user_id) DO UPDATE \"\n            \"  SET tier = EXCLUDED.tier, src_lsn = EXCLUDED.src_lsn \"\n            \"  WHERE features.src_lsn < EXCLUDED.src_lsn\",  # gotcha: ignore stale replays\n            (evt[\"user_id\"], evt[\"tier\"], evt[\"lsn\"]),\n        )\n        conn.commit()  # write lands first…\n    c.commit(msg)  # …THEN we acknowledge — crash here = safe replay"
          },
          {
            "type": "p",
            "text": "Two patterns are doing all the work here: an **upsert keyed on a stable id**, and a **monotonic source-LSN guard** so an out-of-order replay can't overwrite newer data with older data. Together they make 'at-least-once' behave like 'exactly-once' from the database's perspective."
          }
        ]
      },
      {
        "heading": "Try it",
        "body": [
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Make this consumer idempotent. The duplicate event should NOT double-count.",
            "varName": "final_state",
            "starter": "# Two events arrive — the second is a duplicate redelivery.\nevents = [\n    {\"user_id\": 42, \"tier\": \"gold\", \"lsn\": 100},\n    {\"user_id\": 42, \"tier\": \"gold\", \"lsn\": 100},  # at-least-once redelivery\n    {\"user_id\": 42, \"tier\": \"silver\", \"lsn\": 99},  # out-of-order stale replay\n]\n\nstore = {}  # pretend this is a DB row keyed by user_id\n\nfor evt in events:\n    uid = evt[\"user_id\"]\n    cur = store.get(uid)  # current state, or None\n    # gotcha: only apply if this LSN is STRICTLY newer than what's stored\n    if cur is None or evt[\"lsn\"] > cur[\"lsn\"]:\n        store[uid] = evt  # upsert with the monotonic guard\n\nfinal_state = store[42]  # should be tier=gold, lsn=100 — not silver\nprint(final_state)\n",
            "hint": "The duplicate has the same LSN as the first — `>` (strict) skips it. The third has an older LSN — same guard rejects it. That's idempotency in 4 lines."
          },
          {
            "type": "quote",
            "text": "At-most-once loses data. At-least-once duplicates data. Exactly-once is at-least-once with an idempotent sink — and a marketing team.",
            "cite": "every streaming engineer, after their first outage"
          }
        ]
      }
    ]
  },

  "mlops-feature-stores": {
    "sections": [
      {
        "heading": "Why a feature needs its own database",
        "body": [
          {
            "type": "p",
            "text": "**A feature is a computed signal — not a raw column.** `user_avg_basket_7d` is a rolling aggregate, derived from orders, joined with refunds, filtered by region. The model learned on one definition during training. If serving recomputes it slightly differently, you've shipped a silent bug."
          },
          {
            "type": "p",
            "text": "A **feature store** is the system that holds those definitions in one place and serves them to both training (offline, batch) and inference (online, low-latency). **Feast**, **Tecton**, and **Hopsworks** are the names in the room."
          }
        ]
      },
      {
        "heading": "**Offline** vs **online** — same data, two databases",
        "body": [
          {
            "type": "reveal",
            "question": "What's the difference between online and offline features?",
            "answer": "Same logical signal, **two physical stores** with opposite shapes. **Offline** lives in a warehouse (Snowflake, BigQuery, Parquet on S3) — scanned in batch over months of history, used for training and backfills, freshness measured in hours. **Online** lives in a low-latency KV (Redis, DynamoDB) — keyed lookups under 20 ms, used for inference, freshness measured in seconds. One definition fans out to both; if they drift, you've shipped training-serving skew."
          },
          {
            "type": "p",
            "text": "Training is a batch job that scans months of history. Serving is a single request with a 20 ms budget. One physical store can't satisfy both — you need two stores, fed from the same definition."
          },
          {
            "type": "diagram",
            "title": "One feature definition, two serving paths",
            "nodes": [
              { "id": "src",   "label": "Source events",   "subtitle": "orders, clicks",       "x": 0.08, "y": 0.5,  "accent": "water" },
              { "id": "def",   "label": "Feature defs",    "subtitle": "Feast registry",       "x": 0.3,  "y": 0.5,  "accent": "amber" },
              { "id": "wh",    "label": "Offline store",   "subtitle": "Snowflake / BigQuery", "x": 0.58, "y": 0.18, "accent": "earth" },
              { "id": "online","label": "Online store",    "subtitle": "Redis / DynamoDB",     "x": 0.58, "y": 0.82, "accent": "sky" },
              { "id": "train", "label": "Training",        "subtitle": "batch, point-in-time", "x": 0.88, "y": 0.18, "accent": "fire" },
              { "id": "infer", "label": "Inference",       "subtitle": "<20 ms lookup",        "x": 0.88, "y": 0.82, "accent": "fire" }
            ],
            "edges": [
              { "from": "src",   "to": "def",    "kind": "dashed", "label": "ingest",  "accent": "water" },
              { "from": "def",   "to": "wh",     "kind": "dashed", "label": "backfill","accent": "earth" },
              { "from": "def",   "to": "online", "kind": "dashed", "label": "stream",  "accent": "sky" },
              { "from": "wh",    "to": "train",  "kind": "solid",  "label": "scan",    "accent": "earth" },
              { "from": "online","to": "infer",  "kind": "solid",  "label": "get",     "accent": "sky" }
            ]
          },
          {
            "type": "table",
            "headers": ["Concern", "Offline store", "Online store"],
            "align": ["left", "left", "left"],
            "rows": [
              ["Backed by",         "Snowflake, BigQuery, Parquet on S3", "Redis, DynamoDB, Cassandra"],
              ["Access pattern",    "scan **billions** of rows",          "get **one** key in <20 ms"],
              ["Used by",           "training, backfills, eval",          "real-time inference"],
              ["Freshness",         "hours to days",                      "seconds to minutes"],
              ["Cost shape",        "compute-heavy on read",              "memory-heavy, always on"]
            ]
          }
        ]
      },
      {
        "heading": "**Training-serving skew** — the bug you ship by accident",
        "body": [
          {
            "type": "p",
            "text": "Skew happens when the feature value the model trained on differs from the value served at inference for the same logical event. Causes: re-implementing the transform in two languages, a join that uses *now* instead of *event time*, or an online store that's stale."
          },
          {
            "type": "p",
            "text": "Point-in-time correctness is the discipline that prevents it: at training time, only look at data that **would have been visible** at the prediction timestamp. Feature stores do this with as-of joins so you don't have to write them by hand."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from feast import FeatureStore  # canonical OSS feature store\nimport pandas as pd\n\nstore = FeatureStore(repo_path=\".\")  # reads feature_store.yaml from cwd\n\n#  TRAINING — pull historical features with point-in-time join\nentity_df = pd.DataFrame({\n    \"user_id\":   [\"u_1\", \"u_2\", \"u_3\"],\n    \"event_ts\":  pd.to_datetime([\"2026-05-01\", \"2026-05-02\", \"2026-05-03\"]),  # WHEN the prediction was made\n})\ntraining_df = store.get_historical_features(  # joins on event_ts, NOT now\n    entity_df=entity_df,\n    features=[\n        \"user_stats:avg_basket_7d\",  # rolling agg — defined once, used everywhere\n        \"user_stats:returns_30d\",\n    ],\n).to_df()  # ready for model.fit(X, y) — same shape as serving\n\n#  SERVING — same definitions, online store, single-digit-ms lookup\nonline = store.get_online_features(\n    features=[\"user_stats:avg_basket_7d\", \"user_stats:returns_30d\"],\n    entity_rows=[{\"user_id\": \"u_1\"}],  # one row, one user\n).to_dict()  # {'avg_basket_7d': [42.10], 'returns_30d': [3]}\n#  gotcha: if the materializer hasn't pushed yet, online is stale — monitor lag"
          }
        ]
      },
      {
        "heading": "**Trade-offs** before you adopt one",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Adopting a feature store buys you",
            "watchLabel": "What it costs",
            "good": [
              "**One** definition for train and serve — skew dies",
              "Point-in-time correctness for free — no DIY as-of joins",
              "Feature reuse across teams — `user_stats:*` belongs to nobody and everybody",
              "Lineage and freshness SLAs become first-class signals"
            ],
            "watch": [
              "Two stores to operate — Snowflake AND Redis on call",
              "Materialization lag is now a metric you have to monitor",
              "Streaming features (windowed aggregates) are still genuinely hard",
              "Overkill for a single model on a single team — start with a shared SQL view"
            ]
          }
        ]
      },
      {
        "heading": "Try it: write a feature definition",
        "body": [
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Define one Feast FeatureView. Note the TTL — it caps how stale a served value can be.",
            "varName": "fv",
            "starter": "from datetime import timedelta\nfrom feast import Entity, FeatureView, Field\nfrom feast.types import Float32, Int64\nfrom feast.infra.offline_stores.file_source import FileSource\n\nuser = Entity(name=\"user_id\", join_keys=[\"user_id\"])  # the join key — must match online lookup\n\nsource = FileSource(  # offline source — points at parquet in S3 or local\n    path=\"data/user_stats.parquet\",\n    timestamp_field=\"event_ts\",  # required for point-in-time correctness\n)\n\nfv = FeatureView(\n    name=\"user_stats\",  # used in feature refs like 'user_stats:avg_basket_7d'\n    entities=[user],\n    ttl=timedelta(days=7),  # gotcha: served values older than 7d return NULL\n    schema=[\n        Field(name=\"avg_basket_7d\", dtype=Float32),\n        Field(name=\"returns_30d\",   dtype=Int64),\n    ],\n    source=source,\n    online=True,  # materialize into Redis/DynamoDB on `feast materialize`\n)\nprint(fv.name, [f.name for f in fv.schema])\n",
            "hint": "Shorten the TTL to 1 hour. For a fraud model that's appropriate; for a long-cycle churn model it'd null-out most rows. TTL is a freshness contract, not a hint."
          },
          {
            "type": "explain-back",
            "prompt": "In your own words: why does a feature store need both an offline and an online store, and how does it prevent training-serving skew?",
            "modelAnswer": "Training scans months of history across billions of rows — that's a warehouse workload (Snowflake, BigQuery, Parquet on S3). Serving needs a single row back in <20 ms — that's a key-value workload (Redis, DynamoDB). One physical store can't do both well, so you keep two, but you feed both from a **single feature definition** registered in Feast or Tecton. That shared definition is the whole point: the rolling 7-day basket average is computed *once* as code, materialized into the warehouse for training and into Redis for serving. Skew dies because the transform isn't reimplemented in two languages — training and inference literally read the same numbers, joined point-in-time against the prediction timestamp.",
            "hint": "Think about what \"same data, two databases, one definition\" means — and what `point-in-time correctness` prevents."
          },
          {
            "type": "quote",
            "text": "If your training pipeline and your serving pipeline compute the feature differently, you don't have a model — you have a coin flip with extra steps.",
            "cite": "every ML platform retro, eventually"
          }
        ]
      }
    ]
  },
  "mlops-monitoring": {
    "sections": [
      {
        "heading": "Three things drift, and you have to watch all three",
        "body": [
          {
            "type": "p",
            "text": "**Your accuracy dashboard looks fine. Your model is rotting.** Labels arrive days or weeks after predictions — by the time accuracy drops, you're already wrong. The fix is to monitor the *inputs* and *outputs* of the model in near-real-time, not just the eventual ground truth."
          },
          {
            "type": "p",
            "text": "Three things can shift, and each one breaks the model in a different way. Confusing them costs you weeks of debugging the wrong layer."
          }
        ]
      },
      {
        "heading": "**Input**, **prediction**, **concept** — three drifts",
        "body": [
          {
            "type": "terms",
            "items": [
              { "term": "Input drift",      "def": "The feature distribution P(X) shifts. Users got younger, prices went up, a new region launched. Detected per-feature with PSI or KS, in hours." },
              { "term": "Prediction drift", "def": "P(ŷ) shifts — the model's output histogram changes shape. Cheap to compute, no labels needed, often the first alarm to fire." },
              { "term": "Concept drift",    "def": "The relationship P(y|X) itself shifts. Same inputs, different correct answer — fraud patterns evolve, fashion preferences change. Needs labels to detect, slow but lethal." }
            ]
          },
          {
            "type": "diagram",
            "title": "Where each drift signal comes from",
            "nodes": [
              { "id": "req",   "label": "Live requests",     "subtitle": "features X",          "x": 0.08, "y": 0.5,  "accent": "water" },
              { "id": "model", "label": "Model",             "subtitle": "f(X) → ŷ",            "x": 0.32, "y": 0.5,  "accent": "fire" },
              { "id": "log",   "label": "Prediction log",    "subtitle": "X, ŷ, ts",            "x": 0.58, "y": 0.5,  "accent": "earth" },
              { "id": "mon",   "label": "Monitor",           "subtitle": "Evidently / Arize",   "x": 0.82, "y": 0.22, "accent": "amber" },
              { "id": "alarm", "label": "Alarm",             "subtitle": "PSI > 0.25 → page",   "x": 0.82, "y": 0.78, "accent": "fire" }
            ],
            "edges": [
              { "from": "req",   "to": "model", "kind": "dashed", "label": "X",        "accent": "water" },
              { "from": "model", "to": "log",   "kind": "dashed", "label": "ŷ",        "accent": "fire" },
              { "from": "log",   "to": "mon",   "kind": "solid",  "label": "window",   "accent": "amber" },
              { "from": "mon",   "to": "alarm", "kind": "dashed", "label": "threshold","accent": "fire" }
            ]
          }
        ]
      },
      {
        "heading": "**Sliding-window** statistics — PSI and KS",
        "body": [
          {
            "type": "p",
            "text": "You compare a **reference window** (training data, or last month's prod) against a **current window** (last hour, last day). Two statistical tests do 90% of the work."
          },
          {
            "type": "table",
            "headers": ["Test", "What it measures (use for)", "Threshold"],
            "align": ["left", "left", "center"],
            "rows": [
              ["**PSI**",          "Binned distribution shift — categorical + numeric features",  "**> 0.25** = significant"],
              ["**KS test**",      "Max gap between two empirical CDFs — continuous only",        "**p < 0.01**"],
              ["**Chi-squared**",  "Frequency mismatch on categories — needs large samples",      "p < 0.01"],
              ["**Wasserstein**",  "Earth-mover distance — when shape matters more than mean",    "domain-specific"]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np\nfrom scipy.stats import ks_2samp  # KS for continuous features\n\ndef psi(reference, current, bins=10):  # Population Stability Index\n    cuts = np.quantile(reference, np.linspace(0, 1, bins + 1))  # bin EDGES from reference\n    cuts[0], cuts[-1] = -np.inf, np.inf  # catch values outside the training range\n    ref_p = np.histogram(reference, cuts)[0] / len(reference) + 1e-6  # smooth zeros\n    cur_p = np.histogram(current,   cuts)[0] / len(current)   + 1e-6  # avoid log(0)\n    return float(np.sum((cur_p - ref_p) * np.log(cur_p / ref_p)))  # symmetric KL-ish\n\n#  reference = training distribution snapshot, current = last hour of prod\nscore = psi(reference[\"age\"], current[\"age\"])  # compute per feature\nif score > 0.25:  # standard threshold — minor < 0.1, major > 0.25\n    page_oncall(feature=\"age\", psi=score)  # actionable, not just a dashboard\n\nks_stat, p = ks_2samp(reference[\"income\"], current[\"income\"])  # alt test\n#  gotcha: KS rejects almost everything at huge sample sizes — pair with effect size"
          }
        ]
      },
      {
        "heading": "**Alarms** vs **dashboards** — pick what wakes you up",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Wire these as alarms",
            "watchLabel": "Leave these on dashboards",
            "good": [
              "Prediction-rate drop (model returning fewer positives than yesterday)",
              "PSI > 0.25 on any required feature for two consecutive windows",
              "Null-rate spike on an upstream feature — usually an outage upstream",
              "Latency p99 climbing past SLO — model is fine but service is dying"
            ],
            "watch": [
              "Per-feature distribution charts — useful in postmortem, noisy as pages",
              "Confusion matrix heatmaps — slow signal, label-dependent",
              "Long-tail latency histograms — read weekly, don't alarm",
              "Drift on features you don't actually use anymore — clean those up"
            ]
          },
          {
            "type": "p",
            "text": "**Evidently** (OSS reports + tests), **Arize** and **WhyLabs** (managed) are the modern toolchain. They package PSI/KS, slice-and-dice by segment, and integrate with PagerDuty so a real drift becomes a real page — not a dashboard nobody opens."
          }
        ]
      },
      {
        "heading": "Try it: compute a PSI",
        "body": [
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Compute PSI between two distributions. Shift the current sample's mean — watch the score cross 0.25.",
            "varName": "score",
            "starter": "import numpy as np\n\ndef psi(reference, current, bins=10):  # same impl as the lesson\n    cuts = np.quantile(reference, np.linspace(0, 1, bins + 1))\n    cuts[0], cuts[-1] = -np.inf, np.inf\n    ref_p = np.histogram(reference, cuts)[0] / len(reference) + 1e-6\n    cur_p = np.histogram(current,   cuts)[0] / len(current)   + 1e-6\n    return float(np.sum((cur_p - ref_p) * np.log(cur_p / ref_p)))\n\nrng = np.random.default_rng(42)  # reproducible\nreference = rng.normal(loc=0.0, scale=1.0, size=10_000)  # training distribution\ncurrent   = rng.normal(loc=0.5, scale=1.0, size=10_000)  # shifted mean — drift!\n\nscore = psi(reference, current)\nprint(f\"PSI={score:.3f}  ->  {'ALARM' if score > 0.25 else 'ok'}\")\n",
            "hint": "Try loc=0.0 (no drift, PSI≈0), loc=0.3 (minor, ~0.1), loc=0.5 (major, >0.25). Then double the scale — distributions widening also drifts."
          },
          {
            "type": "quote",
            "text": "Accuracy is a trailing indicator. By the time it drops, the question is how long you've been wrong — not whether.",
            "cite": "the case for input-drift monitoring"
          }
        ]
      }
    ]
  },
  "mlops-continuous-training": {
    "sections": [
      {
        "heading": "When **retraining** stops being a manual heroic act",
        "body": [
          {
            "type": "p",
            "text": "**Models decay. Continuous training is the assembly line that replaces them on a schedule, on a signal, or on demand.** It's the same idea as CI/CD for code — but the artifact is a model, the unit test is an eval gate, and the deploy is gradual."
          },
          {
            "type": "p",
            "text": "Three pieces make it real: **DVC** versions the data, the **model registry** versions the artifacts, and the **CI/CD pipeline** promotes a model through stages until it's serving 100% of traffic."
          }
        ]
      },
      {
        "heading": "**Triggers** — what kicks off a retrain",
        "body": [
          {
            "type": "table",
            "headers": ["Trigger", "Use when (and risk)", "Latency"],
            "align": ["left", "left", "center"],
            "rows": [
              ["**Scheduled** (cron nightly)",       "Stable problem, predictable drift — wastes compute on quiet days",      "24 h"],
              ["**Drift-signaled** (PSI > 0.25)",    "Distribution shifts unpredictably — noisy triggers on upstream outages",  "hours"],
              ["**Data-volume** (every N rows)",     "Steady high-velocity event streams — tiny deltas not worth the spend",   "minutes-hours"],
              ["**Manual** (button)",                "Emergency hotfix — out-of-band, bypasses gates if you let it",            "minutes"]
            ]
          },
          {
            "type": "p",
            "text": "Most production systems combine **scheduled + drift-signaled**: a nightly floor with an opportunistic retrain when the monitor screams. Pure event-driven sounds elegant; in practice it pages you at 3 a.m. for a Postgres replica lag."
          }
        ]
      },
      {
        "heading": "**Promotion** — the stages a model passes through",
        "body": [
          {
            "type": "p",
            "text": "A new model doesn't go straight to 100% traffic. It earns its place through a sequence of stages, each with its own gate. The registry (**MLflow**, **Vertex Model Registry**, **SageMaker Model Registry**) records which version is at which stage."
          },
          {
            "type": "kanban",
            "title": "Model promotion stages",
            "caption": "Each column has an entry gate — fail the gate, the model goes back a column",
            "columns": [
              { "name": "Dev",         "wip": null, "items": ["churn-v4.7 (auc 0.84)", "churn-v4.6 (auc 0.83)"] },
              { "name": "Shadow",      "wip": 2,    "items": ["churn-v4.5 (logs only)"] },
              { "name": "Canary",      "wip": 1,    "items": ["churn-v4.4 (5% live)"] },
              { "name": "Prod",        "wip": 1,    "items": ["churn-v4.3 (100%)"] },
              { "name": "Deprecated",  "wip": null, "items": ["churn-v4.2", "churn-v4.1"] }
            ]
          },
          {
            "type": "diagram",
            "title": "CI/CD for an ML pipeline — gates between stages",
            "nodes": [
              { "id": "data",  "label": "Data + DVC",       "subtitle": "versioned",   "x": 0.08, "y": 0.5,  "accent": "earth" },
              { "id": "train", "label": "Train job",        "subtitle": "fit",         "x": 0.3,  "y": 0.5,  "accent": "sky" },
              { "id": "eval",  "label": "Eval gate",        "subtitle": "auc > 0.82",  "x": 0.5,  "y": 0.5,  "accent": "fire" },
              { "id": "reg",   "label": "Registry",         "subtitle": "MLflow",      "x": 0.7,  "y": 0.5,  "accent": "amber" },
              { "id": "serve", "label": "Serving",          "subtitle": "canary",      "x": 0.92, "y": 0.5,  "accent": "fire" }
            ],
            "edges": [
              { "from": "data",  "to": "train", "kind": "dashed", "label": "X, y",     "accent": "earth" },
              { "from": "train", "to": "eval",  "kind": "solid",  "label": "model",    "accent": "sky" },
              { "from": "eval",  "to": "reg",   "kind": "dashed", "label": "pass",     "accent": "amber" },
              { "from": "reg",   "to": "serve", "kind": "dashed", "label": "promote",  "accent": "fire" }
            ]
          }
        ]
      },
      {
        "heading": "**Registry** + **DVC** in code",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "import mlflow  # registry + experiment tracking\nfrom mlflow.tracking import MlflowClient\nimport subprocess\n\n#  1. pin the data snapshot — DVC stores the .dvc pointer in git\nsubprocess.run([\"dvc\", \"pull\", \"data/train.csv.dvc\"], check=True)  # exact bytes the run trained on\ndata_sha = subprocess.check_output([\"dvc\", \"get-hash\", \"data/train.csv\"]).decode().strip()\n\n#  2. train and log to MLflow — model + params + metrics + data SHA in one run\nwith mlflow.start_run() as run:\n    model = train_pipeline(\"data/train.csv\")  # your fit() — implementation elided\n    auc   = evaluate(model, \"data/holdout.csv\")  # gate metric\n\n    mlflow.log_param(\"data_sha\", data_sha)  # reproducibility — same SHA, same θ\n    mlflow.log_metric(\"holdout_auc\", auc)\n    mlflow.sklearn.log_model(model, \"model\", registered_model_name=\"churn\")\n\n#  3. eval gate — promote only if it clears the bar\nclient = MlflowClient()\nv = client.get_latest_versions(\"churn\", stages=[\"None\"])[0]  # newest unstaged version\nif auc > 0.82:  # the gate — bake your business floor here\n    client.transition_model_version_stage(\n        name=\"churn\", version=v.version, stage=\"Staging\"  # MLflow stages: Staging → Production\n    )  # serving layer watches Staging for shadow traffic\n#  gotcha: never auto-promote to Production from CI — humans approve the canary→prod hop"
          },
          {
            "type": "pros-cons",
            "goodLabel": "What this buys you",
            "watchLabel": "What it costs",
            "good": [
              "Every model has a reproducible lineage: git SHA + data SHA + seed",
              "Rollback is `transition_model_version_stage` — not a redeploy",
              "Eval gate blocks bad models before they touch shadow, let alone prod",
              "Shadow + canary catch online regressions the offline metric missed"
            ],
            "watch": [
              "Pipeline complexity explodes — train job, registry, gates, rollout, monitor",
              "DVC + git LFS can get expensive on large datasets — budget the storage",
              "Auto-retrain on noisy drift wastes GPU; pair with debouncing",
              "Schema changes in upstream data break the whole pipeline — version those too"
            ]
          }
        ]
      },
      {
        "heading": "Try it: promote via the MLflow CLI",
        "body": [
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Walk the model-registry CLI flow. The transition is what makes it real to the serving layer.",
            "starter": "#  1. list the latest versions of a registered model\nmlflow models search-versions --filter \"name='churn'\" --order-by 'version_number DESC' \\\n  | head -n 5  # most recent five — sanity check\n\n#  2. transition version 7 into Staging — serving layer picks this up for shadow\nmlflow models transition-version \\\n  --name churn \\\n  --version 7 \\\n  --to-stage Staging \\\n  --archive-existing-versions  # archive any prior Staging — only one at a time\n\n#  3. after the canary passes, promote Staging → Production (humans approve!)\nmlflow models transition-version \\\n  --name churn --version 7 \\\n  --to-stage Production \\\n  --archive-existing-versions  # demotes the old prod model to Archived\n\n#  4. rollback is symmetric — re-promote the previous version, no redeploy needed\nmlflow models transition-version --name churn --version 6 --to-stage Production\n",
            "hint": "Notice that --archive-existing-versions makes the registry the source of truth. The serving layer just polls for 'who is in Production?' — promotion and rollback are the same operation."
          },
          {
            "type": "quote",
            "text": "A model registry is your aircraft logbook — every artifact has a tail number, a lineage, and a date stamped on its retirement.",
            "cite": "the only way to keep ML auditable"
          }
        ]
      }
    ]
  },
  "mlops-ab-testing": {
    "sections": [
      {
        "heading": "Why a better offline model can lose **online**",
        "body": [
          {
            "type": "p",
            "text": "**Offline AUC is a leading indicator. Business KPIs are the truth.** A model with better precision might recommend more accurately but produce shorter sessions; a model with higher recall might surface more results and tank conversion. The only way to know is to put both in front of users."
          },
          {
            "type": "p",
            "text": "Production model testing is a **graduated rollout**: shadow (zero risk), canary (small risk, fast signal), full A/B (real measurement). Skipping stages is how you find out your model is broken from the customer-support inbox."
          }
        ]
      },
      {
        "heading": "**Shadow** → **canary** → **A/B** — the rollout ladder",
        "body": [
          {
            "type": "table",
            "headers": ["Stage", "Traffic", "Decision criterion"],
            "align": ["left", "center", "left"],
            "rows": [
              ["**Shadow**",  "0% (logged in parallel)", "Latency budget + no exceptions"],
              ["**Canary**",  "1-5%",                   "Guardrails (latency, error rate) hold"],
              ["**A/B**",     "50/50",                  "Primary KPI lift, p < 0.05, no SRM"],
              ["**Full**",    "100%",                   "Sustained KPI over weekly cycle"]
            ]
          },
          {
            "type": "sequence",
            "title": "A/B rollout — one request, two models, one truth",
            "caption": "Shadow forks the request — the user only ever sees the control response.",
            "actors": [
              { "id": "user",    "label": "User",            "accent": "water" },
              { "id": "router",  "label": "Router",          "accent": "amber" },
              { "id": "ctrl",    "label": "Control model",   "accent": "sky" },
              { "id": "treat",   "label": "Treatment model", "accent": "fire" },
              { "id": "metrics", "label": "Metrics store",   "accent": "earth" }
            ],
            "events": [
              { "from": "user",   "to": "router",  "label": "request(user_id)",      "note": "hash(user_id) decides bucket" },
              { "from": "router", "to": "ctrl",    "label": "predict (always)",      "note": "control answers the user" },
              { "from": "router", "to": "treat",   "label": "predict (shadow/A-B)",  "note": "fire-and-forget in shadow", "dashed": true },
              { "from": "ctrl",   "to": "router",  "label": "ŷ_control" },
              { "from": "treat",  "to": "router",  "label": "ŷ_treatment",          "note": "in shadow: logged only", "dashed": true },
              { "from": "router", "to": "user",    "label": "response (ŷ chosen)",   "note": "shadow = always control" },
              { "from": "router", "to": "metrics", "label": "log(both ŷ, variant)", "note": "join with conversion later", "dashed": true }
            ]
          }
        ]
      },
      {
        "heading": "**Metrics** that actually decide",
        "body": [
          {
            "type": "terms",
            "items": [
              { "term": "Primary KPI",       "def": "The business metric ship/no-ship hinges on — conversion, watch time, GMV. Pick **before** the experiment starts." },
              { "term": "Guardrail",         "def": "Things that must not regress: p99 latency, error rate, refund rate. Tripping one kills the experiment regardless of primary." },
              { "term": "MDE",               "def": "Minimum detectable effect — the smallest lift worth shipping. Sample size scales as 1/MDE²." },
              { "term": "SRM check",         "def": "Sample-ratio mismatch — if the 50/50 split came out 48/52, the splitter is broken and the result is meaningless." }
            ]
          },
          {
            "type": "p",
            "text": "Offline AUC is **not** a primary KPI. It's a smoke test that proves the model isn't worse on yesterday's data. A 5% lift on offline AUC can be a 0% lift — or a *loss* — on conversion."
          }
        ]
      },
      {
        "heading": "**Shadow** assignment in code",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "import hashlib\nimport asyncio\nimport logging\n\ndef bucket(user_id: str, exp: str, pct: int) -> str:  # deterministic split\n    h = hashlib.md5(f\"{exp}:{user_id}\".encode()).hexdigest()  # salt with exp name\n    return \"treatment\" if int(h[:8], 16) % 100 < pct else \"control\"  # 0..99 buckets\n\nasync def predict(user_id: str, features: dict) -> float:\n    variant = bucket(user_id, exp=\"churn-v4-shadow\", pct=100)  # shadow = 100% logged\n\n    #  ALWAYS run control — it answers the user\n    ctrl_task = asyncio.create_task(control_model.predict(features))\n\n    #  Run treatment in parallel — shadow mode, response is discarded\n    treat_task = asyncio.create_task(treatment_model.predict(features))\n\n    y_ctrl = await ctrl_task  # the user gets this answer\n\n    try:\n        y_treat = await asyncio.wait_for(treat_task, timeout=0.05)  # 50ms cap — never block user\n    except asyncio.TimeoutError:\n        y_treat = None  # gotcha: log the timeout, treatment model is too slow to promote\n\n    logging.info(\"shadow\", extra={\n        \"user_id\": user_id, \"variant\": variant,  # join key for offline analysis\n        \"y_control\": y_ctrl, \"y_treatment\": y_treat,  # compare distributions later\n        \"exp\": \"churn-v4-shadow\",  # which experiment — multiple may run concurrently\n    })\n    return y_ctrl  # in shadow, user ALWAYS sees control"
          }
        ]
      },
      {
        "heading": "Why **online** wins and **offline** loses",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Why a model wins offline but loses online",
            "watchLabel": "Why a model wins online but the eng was offline",
            "good": [
              "Training data didn't include feedback loops — your prod recommender already biased the labels",
              "Counterfactual gap — offline labels show what users did with the OLD model's choices",
              "New model is technically better but slower — latency regresses conversion more than accuracy helps",
              "Calibration shift — same AUC, wrong probabilities, downstream threshold logic breaks"
            ],
            "watch": [
              "**Novelty effect** — users click anything new for a week, then revert. Wait a full weekly cycle.",
              "**Peeking** — stopping the moment p < 0.05 inflates false positives. Fix sample size up front.",
              "**Simpson's paradox** — overall lift hides a segment loss. Always slice by region/device/cohort.",
              "**SRM** — if assignments aren't 50/50 ± noise, the splitter is broken. Throw the result out."
            ]
          },
          {
            "type": "p",
            "text": "Tooling: **Statsig**, **LaunchDarkly Experiments**, **Eppo**, and **Optimizely** ship the splitter + stats engine. Or roll it yourself with a hash-based assigner and a Snowflake/BigQuery query — what matters is the discipline, not the vendor."
          },
          {
            "type": "quote",
            "text": "The model that wins on offline AUC isn't shipped — the model that wins on conversion is. Pick the right metric and the rest is plumbing.",
            "cite": "the only ship/no-ship rule that matters"
          }
        ]
      }
    ]
  },

  // ─── API DESIGN (swe) ─────────────────────────────────────────────────────
};
