// Math For ML quiz bank. Keyed by lesson ID; each entry has a `title` (used in
// the quiz kicker) and a `questions` array. Render order is shuffled in the
// MathQuiz component; we always slice the first five after the shuffle so a
// bank with more than five questions still produces a clean 5-question round.
//
// We deliberately use unicode math symbols (η, θ, ∇, ∑, σ, ε, Δ, ∞, ≤, ≥, ≠, →)
// instead of LaTeX so the formula text renders correctly in any browser without
// a math typesetting engine on the critical path.
//
// Schema (v3) — every question is:
//   { prompt, formula?, options[4], answer (0..3),
//     whyWrong?:  { <idx>: string, default?: string } | string,
//     whyCorrect?: string,
//     bestPractices?: string,
//     explanation?: string  // legacy one-line; kept for back-compat }
// New fields take precedence in rendering; explanation is the fallback.

export default {
  "cs-bigo": {
    "title": "Big O Notation",
    "questions": [
      {
        "prompt": "What is the time complexity of binary search on a sorted array of size n?",
        "formula": "T(n) = T(n/2) + O(1)",
        "options": [
          "O(log n)",
          "O(n)",
          "O(n log n)",
          "O(1) — it’s constant time"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "O(n) is a linear scan — checking each element one at a time. Binary search is exponentially faster because it halves the search range every step.",
          "2": "O(n log n) is the complexity of sorting (mergesort, heapsort). Binary search assumes the array is ALREADY sorted; it doesn't sort.",
          "3": "Constant time would mean the work doesn't depend on n at all. Binary search clearly does more work for larger arrays — just logarithmically more, not linearly."
        },
        "whyCorrect": "Each comparison eliminates half the remaining range, so after k steps you've narrowed n down to n/2ᵏ. Solve 2ᵏ = n and you get k = log₂ n steps. Doubling n adds exactly one more comparison.",
        "bestPractices": "Binary search needs a sorted, random-access structure. If you sort once and search many times, the O(n log n) sort amortizes — but if you only need one lookup, hash lookup at O(1) often beats it.",
        "explanation": "Correct. Each step halves the search range, so the number of steps is ⌈log₂ n⌉. Doubling n adds one more comparison, not double the work."
      },
      {
        "prompt": "Two nested loops over the same array of size n run inside a function. Worst-case complexity?",
        "formula": "for i in n: for j in n: …",
        "options": [
          "O(n)",
          "O(n log n)",
          "O(n²)",
          "O(2ⁿ)"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "O(n) is a single pass. Two nested loops over n × n is quadratic, not linear.",
          "1": "O(n log n) is the sweet spot of sorting — but it requires a divide-and-conquer structure. Plain nested loops have no log factor.",
          "3": "O(2ⁿ) is exponential — naive recursion over subsets, Fibonacci without memoization. Two nested loops are polynomial, not exponential."
        },
        "whyCorrect": "The inner body runs n × n = n² times. This is the canonical quadratic pattern: fine at n=100 (10K ops), painful at n=10K (100M ops), brutal at n=1M (10¹² ops).",
        "bestPractices": "When you spot nested loops over the same data, ask if a hash map or single sort can collapse it to O(n) or O(n log n). Most \"slow at scale\" bugs are accidental O(n²) inside a hot path.",
        "explanation": "Correct. Inner body runs n × n = n² times. This is the classic quadratic pattern: fine at n=100, brutal at n=1,000,000."
      },
      {
        "prompt": "You append n items to a Python list one-by-one. What is the amortized complexity of a single append?",
        "formula": "list.append(x) — amortized cost",
        "options": [
          "O(n) per append",
          "O(log n) per append",
          "O(1) amortized",
          "O(n²) total"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "O(n) per append would mean each insertion copies the whole list. That's linked-list-style appends to a static-size array — not what dynamic arrays do.",
          "1": "There's no log factor in dynamic array resizing. The resizes happen at exponential intervals, so most appends do no resize at all.",
          "3": "O(n²) TOTAL would be the cost if every append copied everything. Total append cost is O(n), not O(n²), because resizes double capacity."
        },
        "whyCorrect": "Dynamic arrays double capacity on resize. n appends trigger O(log n) resizes whose total copy cost is bounded by 2n (geometric series). So total = O(n), per-append amortized = O(1). Individual resizes are O(n) but rare.",
        "bestPractices": "Pre-allocate when n is known (`[None]*n`) to skip resizes entirely. For frequent inserts at the FRONT, use `collections.deque` — list pop(0)/insert(0) are O(n).",
        "explanation": "Correct. Dynamic arrays double capacity on resize, so n appends cost O(n) total → O(1) per append on average. Individual resizes are O(n) but rare."
      }
    ]
  },
  "training-eval": {
    "title": "Training & Evaluation",
    "questions": [
      {
        "prompt": "If the learning rate η is too large, what happens?",
        "formula": "θₙ₊₁ = θₙ − η · ∇L(θₙ)",
        "options": [
          "Training is slow but steady",
          "The model overfits the training data",
          "Updates overshoot the minimum, loss oscillates or diverges",
          "The gradient becomes zero permanently"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Slow but steady is what a SMALL η causes — tiny steps, smooth descent, lots of epochs needed. Large η is the opposite failure mode.",
          "1": "Overfitting is a separate problem (too much capacity or too many epochs on too little data). Bad LR causes loss-curve pathologies, not memorization.",
          "3": "Gradient hitting zero is the vanishing-gradient problem — caused by deep nets with saturating activations, not by LR being too high."
        },
        "whyCorrect": "Large η pushes θ past the minimum each step. The loss landscape becomes a bouncing ball — you keep overshooting and your loss bounces around or trends UP epoch over epoch. Common signal: loss after epoch 1 is HIGHER than epoch 0.",
        "bestPractices": "Start around η = 1e-3 for Adam, 1e-2 for SGD. Watch loss after epoch 1 — if it's higher than epoch 0, halve η. Use a learning-rate schedule (step decay, cosine) to anneal as you converge.",
        "explanation": "Correct. Large η pushes θ past the minimum each step. The loss landscape becomes a bouncing ball. Common signal: loss goes up after one epoch."
      },
      {
        "prompt": "Training loss keeps dropping but validation loss starts rising. What is happening?",
        "formula": "L_train ↓   L_val ↑",
        "options": [
          "Overfitting — the model is memorizing training noise",
          "Underfitting — the model needs more capacity",
          "Data leakage from val into train",
          "The optimizer is stuck in a saddle point"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Underfitting shows BOTH train and val loss as high — the model can't even fit the training data. Here train loss is dropping fine.",
          "2": "Data leakage would make val loss DROP unrealistically (the model has effectively seen the val data). The opposite is happening — val is getting worse.",
          "3": "A saddle point would mean training loss plateaus, not drops. Plus saddle points don't selectively harm val loss while train still improves."
        },
        "whyCorrect": "The widening train-vs-val gap is the textbook overfitting signature. The model has enough capacity to memorize idiosyncrasies of the training set that don't generalize, so val (which has different idiosyncrasies) gets worse.",
        "bestPractices": "Combat overfitting with early stopping (save best-val-loss checkpoint), regularization (dropout, weight decay), data augmentation, or more data. Halving the model size is also a valid lever.",
        "explanation": "Correct. The gap between train and val loss is the overfitting signature. Stop early, add regularization, or get more data."
      },
      {
        "prompt": "A binary classifier predicts every example as the majority class. Dataset is 95% negative, 5% positive. Which metric will look misleadingly good?",
        "formula": "accuracy = (TP + TN) / (TP + TN + FP + FN)",
        "options": [
          "Recall on the positive class",
          "F1 score",
          "Plain accuracy",
          "AUC-ROC"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Recall on positives would be ZERO — the model predicts no positives, so TP = 0 and recall = 0/5 = 0. That's NOT misleadingly good; it correctly screams failure.",
          "1": "F1 needs both precision and recall on the positive class. With zero positives predicted, recall is 0 and F1 is 0. Also correctly screams failure.",
          "3": "AUC-ROC measures ranking quality across thresholds. A constant predictor produces a degenerate curve (AUC ≈ 0.5), correctly flagging \"no signal\"."
        },
        "whyCorrect": "Plain accuracy = correct/total. Predicting all-negative gets you 95% of 100 examples right (the 95 negatives) and 0 of 5 positives = 95% accuracy. The metric LOOKS great while the model is useless for the minority class.",
        "bestPractices": "On imbalanced data, ALWAYS report precision/recall/F1 on the minority class, and prefer PR-AUC over ROC-AUC. Stratify your train/val splits to preserve class ratios.",
        "explanation": "Correct. Predicting all-negative scores 95% accuracy on a 95/5 dataset while catching zero positives. Use precision/recall/F1 for imbalanced data."
      }
    ]
  },
  "llm-rag": {
    "title": "Retrieval-Augmented Generation",
    "questions": [
      {
        "prompt": "Two embedding vectors point in nearly the same direction. Their cosine similarity is closest to:",
        "formula": "cos(θ) = (a · b) / (‖a‖ · ‖b‖)",
        "options": [
          "0",
          "0.5",
          "1",
          "−1"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Cosine = 0 means the vectors are ORTHOGONAL (90° apart) — semantically unrelated. \"Same direction\" is the opposite case.",
          "1": "Cosine = 0.5 corresponds to a 60° angle — meaningfully related but not aligned. Closer than orthogonal, not as close as identical.",
          "3": "Cosine = −1 means vectors point OPPOSITE directions (180° apart). That's antonyms or hard contradictions in embedding space, not same direction."
        },
        "whyCorrect": "Cosine similarity is the cosine of the angle between vectors. Cos(0°) = 1, cos(90°) = 0, cos(180°) = −1. Magnitude is normalized out — only direction (semantic meaning) matters.",
        "bestPractices": "Pre-normalize embeddings to unit length once at index time. Then cosine similarity reduces to a dot product — much faster on the retrieval hot path with no loss of precision.",
        "explanation": "Correct. Cosine similarity = 1 when vectors are aligned, 0 when orthogonal, −1 when opposite. Magnitude is normalized out — only direction matters."
      },
      {
        "prompt": "Your RAG system retrieves the top-k chunks by similarity. Increasing k from 3 to 20 mostly causes:",
        "formula": "top-k retrieval — k ↑",
        "options": [
          "More context, more tokens, more chance of distracting the model",
          "Higher precision, fewer hallucinations",
          "Lower latency because more docs parallelize",
          "The embedding model retrains itself"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "More retrieved chunks LOWER precision — you're reaching deeper into the ranked list where similarity scores are weaker. Hallucinations can actually rise as noise drowns the signal.",
          "2": "Latency goes UP, not down. Each retrieved chunk eats input tokens, which means more generation time and higher cost. Retrieval itself is cheap; LLM input scaling is not.",
          "3": "Retrieval k is an inference-time hyperparameter. It has no effect on the embedding model's weights — there's no online training loop here."
        },
        "whyCorrect": "Bigger k means more candidate context — including increasingly off-topic chunks. The model's attention dilutes across irrelevant material, and token costs climb roughly linearly. It's a precision/recall/cost tradeoff, not a free lunch.",
        "bestPractices": "Tune k empirically on a labeled eval set. Often a small k (3-5) with a cross-encoder re-ranker beats a large k with no re-ranker. Cap input tokens to leave headroom for the answer.",
        "explanation": "Correct. Bigger k = more relevant context but also more noise and a fatter token bill. Tuning k is a precision/recall/cost tradeoff, not a free lunch."
      },
      {
        "prompt": "You chunk documents at 4096 tokens each. Queries about specific facts return whole pages of irrelevant text. The fix?",
        "formula": "chunk_size — too large",
        "options": [
          "Decrease chunk size (e.g. 256–512 tokens) so retrieval is more targeted",
          "Increase chunk size to 8192",
          "Switch embedding models",
          "Add more documents to the index"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Bigger chunks make the problem WORSE — even more irrelevant text gets dragged in with the one relevant sentence.",
          "2": "Embedding models matter, but the root cause here is GRANULARITY, not representation quality. A new embedder on giant chunks has the same problem.",
          "3": "More documents = more haystacks. Doesn't address the fact that each retrieved chunk is a whole page when you only needed a paragraph."
        },
        "whyCorrect": "Smaller chunks let the retriever pinpoint the relevant sentence instead of a whole page. With 4096-token chunks, one fact is buried in a wall of context; with 256-512 tokens, retrieval becomes surgical.",
        "bestPractices": "Try 256-1024 tokens with ~10-20% overlap so facts that straddle a boundary aren't lost. Tune on your actual queries — there's no universal best size.",
        "explanation": "Correct. Smaller chunks let the retriever pinpoint the relevant sentence instead of dragging in a whole page. 256–1024 tokens is a common sweet spot."
      }
    ]
  },
  "ml-core-linear-regression": {
    "title": "Linear regression",
    "questions": [
      {
        "prompt": "You're fitting a line ŷ = wx + b to minimize mean squared error. What does MSE actually measure?",
        "formula": "L(w, b) = (1/n) · ∑(yᵢ − ŷᵢ)²",
        "options": [
          "The average squared vertical residual between prediction and target",
          "The average vertical distance from each point to the line",
          "The perpendicular distance from each point to the line",
          "The sum of absolute errors |yᵢ − ŷᵢ|"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "That's mean ABSOLUTE error (MAE), which uses |residual| rather than residual². MAE penalizes a 10-unit miss as 10× a 1-unit miss; MSE penalizes it as 100×.",
          "2": "Perpendicular distance is what Total Least Squares / PCA-style regression minimizes. Ordinary least squares only measures the VERTICAL (y-axis) gap — it assumes x is noise-free.",
          "3": "Sum of absolute errors is unscaled MAE (no division by n, no squaring). Squaring is what makes MSE differentiable everywhere and quadratically punishes outliers."
        },
        "whyCorrect": "MSE squares the residual yᵢ − ŷᵢ and averages over n points. Squaring makes the loss smooth and differentiable at zero (unlike MAE), and it disproportionately penalizes large misses — which is exactly why a few outliers can drag the fitted line around.",
        "bestPractices": "Use MSE/RMSE as your default regression loss; switch to MAE or Huber when outliers are common and you don't want them dominating the fit. Always report RMSE in the same units as y so the number is interpretable."
      },
      {
        "prompt": "During one gradient descent step you compute ∇L(θ). Which direction does the update move θ?",
        "formula": "θₙ₊₁ = θₙ − η · ∇L(θₙ)",
        "options": [
          "Along −∇L — opposite the gradient, toward lower loss",
          "Along +∇L — toward steeper loss",
          "Perpendicular to ∇L — along a level set of L",
          "Toward the origin θ = 0"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Moving along +∇L is gradient ASCENT — you'd climb the loss surface. That's what you do when maximizing a likelihood, not minimizing a loss.",
          "2": "Moving perpendicular to ∇L keeps loss roughly constant (you're walking along a contour). You'd never reach the minimum that way — no progress per step.",
          "3": "Moving toward θ = 0 is what L2 regularization / weight decay pulls you toward, not the bare gradient step. The gradient cares about the loss surface, not the origin."
        },
        "whyCorrect": "The gradient ∇L points in the direction of steepest ASCENT of L. To minimize, you subtract it — that's why the rule has a minus sign. The step size η scales how far you go; the direction is fixed by the negative gradient.",
        "bestPractices": "Plot loss every epoch — a monotone-decreasing curve confirms the sign is right and η isn't too big. If loss is flat or climbing, suspect a sign bug (gradient ascent), wrong η, or a non-differentiable spot."
      },
      {
        "prompt": "You crank the learning rate η up to speed training. Loss after epoch 1 is HIGHER than epoch 0 and keeps oscillating. What's going on?",
        "formula": "θₙ₊₁ = θₙ − η · ∇L(θₙ),  η too large",
        "options": [
          "η is too large",
          "η is too small — the model hasn't moved yet",
          "The model is overfitting the training set",
          "The gradient has vanished to zero"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Too-small η produces slow but MONOTONICALLY decreasing loss — flat and boring, not bouncing. Oscillation is the opposite failure mode.",
          "2": "Overfitting shows up as train loss dropping while VAL loss rises — a generalization gap. Here even train loss is going up, which is an optimization failure, not a generalization one.",
          "3": "Vanishing gradients cause loss to PLATEAU because updates approach zero. Oscillating loss means updates are huge, not zero."
        },
        "whyCorrect": "For a convex quadratic loss (which linear regression is), there's a stability ceiling: η must be below 2/λ_max where λ_max is the top eigenvalue of the Hessian XᵀX. Above that, each step overshoots and amplifies the error — the iterates diverge. Oscillating loss is the canonical signal. Each step overshoots the minimum and bounces across the bowl.",
        "bestPractices": "Halve η whenever loss-after-epoch-1 exceeds loss-at-init. Standardize features (mean 0, unit variance) so the Hessian's eigenvalues are well-conditioned and a single η works for every weight; otherwise the largest-scale feature sets the stability ceiling for all of them."
      },
      {
        "prompt": "For linear regression with MSE loss, there's a closed-form solution that skips gradient descent entirely. Which expression gives the optimal weights?",
        "formula": "θ* = (XᵀX)⁻¹ Xᵀy",
        "options": [
          "θ* = (XᵀX)⁻¹ Xᵀy",
          "θ* = X⁻¹ y",
          "θ* = Xᵀ(XXᵀ)⁻¹ y",
          "θ* = (XXᵀ)⁻¹ Xy"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "X⁻¹ only exists when X is SQUARE and invertible — i.e., exactly as many samples as features with no redundancy. Real datasets have n ≫ d (tall X), so X⁻¹ isn't even defined.",
          "2": "Xᵀ(XXᵀ)⁻¹y is the minimum-norm solution for the UNDERDETERMINED case (more features than samples, d > n). It's the right pseudo-inverse, not the left one used in standard OLS.",
          "3": "(XXᵀ)⁻¹Xy mixes the shapes wrong: XXᵀ is n×n (sample-by-sample) and Xy isn't even a valid product when X is n×d and y is n×1. The dimensions don't line up."
        },
        "whyCorrect": "Setting ∇L = 0 for MSE gives the normal equations XᵀX θ = Xᵀy. Solving yields θ* = (XᵀX)⁻¹Xᵀy — the left pseudo-inverse applied to y. It's the unique global minimum because MSE is convex and XᵀX is positive semi-definite.",
        "bestPractices": "For small d (≤ a few thousand features) the closed form is fastest and exact — no learning rate to tune. For huge d, or when XᵀX is near-singular, skip the explicit inverse: use np.linalg.lstsq or add ridge λI to XᵀX for numerical stability."
      },
      {
        "prompt": "Two of your input features are nearly perfectly correlated (multicollinearity). What goes wrong with the closed-form solution (XᵀX)⁻¹Xᵀy?",
        "formula": "det(XᵀX) ≈ 0  →  (XᵀX)⁻¹ explodes",
        "options": [
          "XᵀX becomes nearly singular",
          "Nothing — OLS handles correlated features fine",
          "The bias term b grows without bound",
          "Training loss goes to infinity"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "OLS does NOT handle near-duplicate columns gracefully. Predictions can still look fine on the training set, but the individual weights become wildly unstable and useless for interpretation.",
          "2": "The bias b is unaffected by feature-feature correlation — it absorbs the mean of y. The instability lands on the slope WEIGHTS for the correlated features, not the intercept.",
          "3": "Training loss stays finite — the model can still fit the data. The pathology is in the WEIGHTS (huge magnitudes, opposite signs that cancel), not in the loss value."
        },
        "whyCorrect": "When two columns are nearly identical, det(XᵀX) → 0 and the matrix is near-singular. Its inverse has huge eigenvalues, so tiny noise in y gets amplified into massive, often opposite-signed weights on the correlated features. Predictions stay reasonable; coefficients become meaningless. The inverse blows up and weights become huge and unstable.",
        "bestPractices": "Add L2 regularization: ridge regression uses (XᵀX + λI)⁻¹Xᵀy, which guarantees invertibility and shrinks unstable weights. Or drop one of the correlated features — check VIF (variance inflation factor) > 10 as a rule of thumb for problematic collinearity."
      }
    ]
  },
  "ml-core-logistic-regression": {
    "title": "Logistic regression",
    "questions": [
      {
        "prompt": "You feed a very large positive logit z into the sigmoid σ(z) = 1/(1+e⁻ᶻ). What does σ(z) approach?",
        "formula": "σ(z) = 1 / (1 + e⁻ᶻ)",
        "options": [
          "0",
          "0.5",
          "1",
          "+∞"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "σ(z) → 0 happens at the OTHER extreme — large NEGATIVE z. You're likely confusing the direction of the asymptote with the input sign.",
          "1": "σ(0) = 0.5 — that's the midpoint, the value at the decision boundary. Large positive z is far past the boundary, not on it.",
          "3": "Sigmoid is BOUNDED in (0, 1) — it can't return anything above 1, let alone +∞. You may be thinking of the raw logit z itself, which is unbounded; sigmoid is precisely the squashing function that fixes that."
        },
        "whyCorrect": "As z → +∞, e⁻ᶻ → 0, so σ(z) → 1/(1+0) = 1. The whole point of sigmoid is to squash any real number into the open interval (0, 1) so the output reads as a probability. Symmetrically, z → −∞ gives σ → 0, and z = 0 gives σ = 0.5.",
        "bestPractices": "In code, never compute e⁻ᶻ directly for very negative z — it overflows. Use a numerically stable formulation (e.g. log1p, or the piecewise trick σ(z) = eᶻ/(1+eᶻ) when z < 0). Most libraries' built-in `sigmoid`/`expit` already handles this."
      },
      {
        "prompt": "A logistic regression model outputs σ(wᵀx + b) = 0.5 for some input x. What does this geometrically mean?",
        "formula": "σ(z) = 0.5  ⇔  z = 0  ⇔  wᵀx + b = 0",
        "options": [
          "x lies exactly on the decision boundary",
          "x is the centroid of the training data",
          "x is an outlier the model has never seen",
          "The model is undertrained and has not converged"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The centroid (data mean) has no special relationship to where σ = 0.5. The boundary is determined by the learned w and b, not by where the data clusters.",
          "2": "Outliers can produce any sigmoid value — often very confident (near 0 or 1) because they sit far from the boundary in some direction. σ = 0.5 specifically means maximum uncertainty, not novelty.",
          "3": "A fully converged model can absolutely output 0.5 — that's just what it returns at the boundary. Convergence is about loss minimization, not the value of any single prediction."
        },
        "whyCorrect": "σ(z) = 0.5 iff z = 0, and z = wᵀx + b = 0 is the equation of a hyperplane — the decision boundary. Points on this hyperplane are exactly where the model is maximally uncertain (50/50). Move x to one side and σ rises toward 1; move to the other side and it falls toward 0.",
        "bestPractices": "The default 0.5 threshold isn't sacred — for imbalanced data or asymmetric costs (e.g. fraud, medical screening), sweep thresholds on a PR curve and pick one that hits your precision/recall target. Calibrate first (Platt or isotonic) if downstream consumers treat outputs as true probabilities."
      },
      {
        "prompt": "Why is mean-squared error a bad loss for logistic regression, and why is binary cross-entropy preferred?",
        "formula": "L_CE = −[y·log(p) + (1−y)·log(1−p)]",
        "options": [
          "MSE on sigmoid outputs is non-convex in the parameters, so gradient descent gets stuck in local minima; cross-entropy is convex",
          "MSE is undefined when p is between 0 and 1",
          "Cross-entropy trains faster only because it has fewer terms to compute",
          "MSE punishes correct predictions and rewards wrong ones"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "MSE is perfectly well-defined for p ∈ (0,1) — it's just (y − p)². The problem isn't definedness; it's the shape of the loss surface.",
          "2": "Cross-entropy actually has MORE structure per term (logs), not fewer. Its win is the loss geometry and gradient behavior, not raw FLOPs.",
          "3": "MSE still penalizes wrong predictions more than right ones — its loss values are sane. The issue is the optimization landscape and gradient magnitudes, not the sign of the penalty."
        },
        "whyCorrect": "MSE composed with sigmoid produces a non-convex loss in w, b — multiple local minima, and the gradient also gets multiplied by σ'(z) = σ(1−σ), which vanishes when the model is very wrong (z far from 0). Cross-entropy is the negative log-likelihood under a Bernoulli model: it's convex, and its gradient with respect to z simplifies to (p − y) — large when wrong, small when right, exactly what you want.",
        "bestPractices": "Always use `BCEWithLogitsLoss` / `binary_crossentropy(from_logits=True)` rather than applying sigmoid yourself then taking BCE — the fused version uses the log-sum-exp trick to stay numerically stable when logits are large in magnitude."
      },
      {
        "prompt": "Treating σ(wᵀx + b) as P(y=1 | x), what is the binary cross-entropy loss equivalent to under the maximum-likelihood view?",
        "formula": "L(w,b) = −∑ᵢ [yᵢ·log(pᵢ) + (1−yᵢ)·log(1−pᵢ)]",
        "options": [
          "Maximizing the log-likelihood of the data under a Bernoulli model",
          "Minimizing the squared distance from the decision boundary",
          "Maximizing the entropy of the predicted distribution",
          "Minimizing the KL divergence from a uniform prior"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Squared-distance minimization is what SVMs (hinge loss + margin) and MSE do. Logistic regression doesn't care about geometric margin directly — it cares about probability calibration via likelihood.",
          "2": "Maximizing entropy would push every prediction toward 0.5 — the opposite of fitting the data. The model would deliberately become uncertain. (MaxEnt models exist, but with constraints — that's a different objective.)",
          "3": "KL from a uniform prior would again push outputs toward 0.5 and ignore the labels entirely. Cross-entropy here is between the LABEL distribution and the predicted distribution, not against any prior."
        },
        "whyCorrect": "If each yᵢ is Bernoulli(pᵢ) with pᵢ = σ(wᵀxᵢ + b), the log-likelihood is exactly ∑ᵢ [yᵢ·log(pᵢ) + (1−yᵢ)·log(1−pᵢ)]. Negating it gives the cross-entropy loss. So minimizing BCE is identical to maximum-likelihood estimation of w, b — that's where the loss comes from, not an arbitrary choice.",
        "bestPractices": "Because BCE is the negative log-likelihood, adding L2 regularization (weight decay) is equivalent to a Gaussian prior on w — i.e. MAP estimation. Tune the regularization strength by cross-validation; for high-dimensional sparse features, L1 (Lasso) gives feature selection for free."
      },
      {
        "prompt": "You add a regularization term λ·‖w‖² to the logistic regression objective. As λ → ∞, what happens to the decision boundary?",
        "formula": "L_reg = L_CE + λ·‖w‖²",
        "options": [
          "It rotates to be perpendicular to the largest feature",
          "It overfits the training data more aggressively",
          "It flattens — weights shrink toward 0, predictions collapse toward σ(b), and the boundary becomes ill-defined",
          "It converges to the maximum-margin SVM boundary"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Regularization shrinks weights uniformly (L2) or sparsely (L1) — it doesn't rotate the boundary toward any particular feature axis. You may be confusing this with PCA or with feature scaling effects.",
          "1": "Regularization REDUCES overfitting by penalizing large weights. Cranking λ up moves you the opposite direction — toward underfitting, not more overfitting.",
          "3": "L2-regularized logistic regression and SVM are related but distinct objectives — logistic uses log-loss, SVM uses hinge loss. The maximum-margin limit specifically arises from hinge loss + the constraint structure, not from λ → ∞ on BCE."
        },
        "whyCorrect": "With λ huge, the penalty λ·‖w‖² dominates and forces w → 0. The logit becomes just b, every prediction is σ(b) — a constant — and there's no real decision boundary anymore (the 'boundary' wraps every point or no point depending on b's sign). This is extreme underfitting.",
        "bestPractices": "Tune λ (or its inverse C in scikit-learn) on a log scale via cross-validation — start with values like {1e-3, 1e-2, ..., 1e2}. Always standardize features first; otherwise the penalty unfairly squashes weights tied to large-scale features more than small-scale ones."
      }
    ]
  },
  "math-linalg": {
    "title": "Linear Algebra for ML",
    "questions": [
      {
        "prompt": "You multiply a 2D vector x by matrix A. Geometrically, what is A·x?",
        "formula": "A · x = x₁·a₁ + x₂·a₂   (a₁, a₂ are columns of A)",
        "options": [
          "The dot product of x with each row, returned as a scalar",
          "A rotation of x by the angle stored in A's first entry",
          "An element-wise product of x and A's diagonal",
          "A linear combination of A's columns, weighted by the components of x"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "Row-dot-product interpretation gives the right NUMBERS, but matrix-vector multiply returns a VECTOR, not a scalar. Confusing this with a single dot product loses the geometric picture entirely.",
          "1": "Rotation is one special case (when A is a rotation matrix), not the general rule. Most matrices also scale and shear; reducing A·x to 'rotation by some angle' hides shear, scaling, and reflection.",
          "2": "Element-wise (Hadamard) product is a different operation — A ⊙ x — and only makes sense for same-shape operands. Matrix multiply mixes components across dimensions; element-wise does not."
        },
        "whyCorrect": "A·x literally rewrites x in terms of A's column vectors: the i-th component of x tells you how much of the i-th column to add. This is why the column space of A is the set of all possible outputs A·x — the geometry is 'where can A send things'.",
        "bestPractices": "When debugging a layer, print the columns of the weight matrix and ask 'what directions does this map onto'. Dead/duplicate columns mean wasted capacity — a common reason a wide layer underperforms a narrower well-conditioned one."
      },
      {
        "prompt": "Two unit vectors u and v have a dot product of 0.5. What is the angle between them?",
        "formula": "u · v = ‖u‖ · ‖v‖ · cos(θ)",
        "options": [
          "0° — they point the same way",
          "30°",
          "60°",
          "90° — they are orthogonal"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "0° would give cos(0) = 1, so u·v would be 1·1·1 = 1, not 0.5. 'Same direction' is the maximum-dot-product case, not the half-magnitude case.",
          "1": "Confusing sin and cos. sin(30°) = 0.5, but the dot-product formula uses COS, not sin. cos(30°) ≈ 0.866 — a much closer alignment than 0.5.",
          "3": "90° gives cos(90°) = 0, so orthogonal vectors have dot product zero. A dot product of 0.5 is meaningfully aligned, not perpendicular."
        },
        "whyCorrect": "With unit vectors, ‖u‖ = ‖v‖ = 1, so u·v = cos(θ) directly. cos(60°) = 0.5, so θ = 60°. This is why pre-normalizing embeddings turns cosine similarity into a single dot product — the magnitudes drop out.",
        "bestPractices": "In retrieval and contrastive learning, L2-normalize vectors once at index time so cosine similarity == dot product. You get the same ranking with a cheaper kernel on the hot path, and FAISS/ScaNN have heavily optimized dot-product paths."
      },
      {
        "prompt": "An n×n matrix A has rank n−2. What does this tell you about its null space and invertibility?",
        "formula": "rank(A) + dim(null(A)) = n",
        "options": [
          "Null space is {0}; A is invertible",
          "Rank-nullity only applies to square matrices, so the question is ill-posed",
          "Null space is all of ℝⁿ; A is the zero matrix",
          "Null space has dimension 2; A is singular (not invertible)"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "A trivial null space {0} would require rank n (full rank). Rank n−2 means A flattens two independent directions to zero, so non-zero vectors get sent to 0.",
          "1": "Rank-nullity holds for ANY matrix (rectangular included): rank + nullity = number of columns. The question is well-posed; this answer is a dodge.",
          "2": "Null space = all of ℝⁿ would mean A sends EVERYTHING to zero — that's the zero matrix, which has rank 0, not rank n−2."
        },
        "whyCorrect": "By rank-nullity, dim(null A) = n − rank(A) = 2. A is invertible iff it's full rank, so rank n−2 (with n ≥ 3) means singular. Two independent directions get crushed to zero, and you cannot undo that — information is destroyed.",
        "bestPractices": "In ML, near-rank-deficient weight or covariance matrices cause numerically unstable inverses. Use pseudo-inverse (pinv) or add a small ridge λ·I before inverting; in PCA pipelines, drop components with σᵢ near machine epsilon rather than dividing by them."
      },
      {
        "prompt": "You run PCA on a centered data matrix. What do the top eigenvalues of the covariance matrix represent?",
        "formula": "C = (1/n) · XᵀX   →   C · vᵢ = λᵢ · vᵢ",
        "options": [
          "The mean of each feature",
          "The number of samples that load on each component",
          "The classification accuracy of each component",
          "The variance captured along each principal direction"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "Means are removed by centering BEFORE you compute the covariance — that's the whole point of centering. Eigenvalues describe spread around the mean, not the mean itself.",
          "1": "Eigenvalues are properties of the covariance MATRIX, independent of sample count (once you've estimated C). A component isn't 'used' by a fixed number of samples.",
          "2": "PCA is unsupervised — it has no labels and so no notion of accuracy. Conflating 'biggest eigenvalue' with 'most useful for classification' is a common trap: top variance ≠ top discriminative power."
        },
        "whyCorrect": "Eigenvectors of C are the principal directions; the matching eigenvalue λᵢ is the variance of the data when projected onto vᵢ. Picking the top-k eigenvalues gives you the k-dimensional subspace that preserves the most variance — equivalently, the best rank-k linear reconstruction in L2.",
        "bestPractices": "Plot the cumulative explained-variance ratio (Σλᵢ / Σλ) and pick k at the elbow or at 95-99% retained variance. For classification, prefer LDA or supervised feature selection — top-variance directions can be label-irrelevant noise (lighting, mic gain)."
      },
      {
        "prompt": "Which condition guarantees that a square matrix A is invertible?",
        "formula": "A · A⁻¹ = I   ⇔   det(A) ≠ 0",
        "options": [
          "All entries of A are nonzero",
          "A is symmetric",
          "det(A) ≠ 0, equivalently all eigenvalues are nonzero",
          "A has more rows than columns"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Nonzero entries say nothing about linear independence of rows/columns. The all-ones matrix has no zeros and is rank 1 — completely non-invertible.",
          "1": "Symmetric matrices can absolutely be singular — the zero matrix is symmetric, and any rank-deficient covariance is symmetric. Symmetry buys you real eigenvalues and orthogonal eigenvectors, not invertibility.",
          "3": "A square matrix has equal rows and columns by definition. 'More rows than columns' describes a tall rectangular matrix, which isn't even square — it has no inverse, only a pseudo-inverse."
        },
        "whyCorrect": "A is invertible iff det(A) ≠ 0, iff its columns are linearly independent, iff it has full rank, iff 0 is not an eigenvalue. All five conditions are equivalent — pick whichever is easiest to check for the matrix in front of you.",
        "bestPractices": "Never compute A⁻¹ explicitly to solve A·x = b — use np.linalg.solve or a factorization (LU, Cholesky for SPD). Check condition number κ(A) = σ_max/σ_min before trusting any inverse; κ > 1e10 means you're amplifying float noise into garbage."
      }
    ]
  },
  "math-calculus": {
    "title": "Calculus for ML",
    "questions": [
      {
        "prompt": "At a point on a loss curve, the derivative dL/dθ equals −3. Which interpretation is correct?",
        "formula": "dL/dθ = lim_{Δθ→0} ΔL / Δθ",
        "options": [
          "The loss is decreasing as θ decreases",
          "The loss is exactly 3 at this point",
          "θ should be increased by 3 to reach the minimum",
          "The loss decreases by 3 units for each unit increase in θ (locally)"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "You flipped the sign of the slope. A negative derivative means loss FALLS as θ rises — equivalently, loss RISES as θ falls. Watch the direction.",
          "1": "You confused the value of the derivative with the value of the function. dL/dθ is the slope OF L at θ, not L itself.",
          "2": "The derivative is a slope, not a distance to the minimum. It tells you the local rate of change, not how far away the optimum is — and distance also depends on curvature (second derivative)."
        },
        "whyCorrect": "The derivative is the local linear approximation: ΔL ≈ (dL/dθ) · Δθ. With dL/dθ = −3, a small +Δθ gives roughly −3·Δθ change in L — loss drops three times as fast as θ rises. SGD will use this slope to step θ in the loss-decreasing direction.",
        "bestPractices": "When debugging training, log gradient magnitudes per layer. If one layer's |∂L/∂θ| is 1000× larger than the rest, your effective learning rate on that layer is wildly off — clip gradients or normalize the layer.",
        "explanation": "Correct. The derivative is the local slope: ΔL ≈ (dL/dθ)·Δθ, so −3 means L drops 3× as fast as θ rises (locally)."
      },
      {
        "prompt": "For L(θ₁, θ₂), the partial derivative ∂L/∂θ₁ tells you:",
        "formula": "∂L/∂θ₁ = lim_{Δθ₁→0} [L(θ₁+Δθ₁, θ₂) − L(θ₁, θ₂)] / Δθ₁",
        "options": [
          "The rate of change of L when both θ₁ and θ₂ vary together",
          "The slope of L along the steepest-ascent direction",
          "The total change in L from the start of training to now",
          "The rate of change of L with respect to θ₁, holding θ₂ fixed"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "That's the total or directional derivative, not a partial. Partials freeze every other variable so you can isolate one knob at a time — that's the whole point.",
          "1": "The steepest-ascent direction is the FULL gradient ∇L = (∂L/∂θ₁, ∂L/∂θ₂). A single partial is just one component of that vector, not the whole direction.",
          "2": "You confused an instantaneous derivative with a finite accumulated change. ∂L/∂θ₁ is a local rate (units of L per unit of θ₁), not a running total over training steps."
        },
        "whyCorrect": "A partial derivative measures how L changes when you wiggle θ₁ alone and pin every other parameter in place. That isolation is what lets you compute per-weight updates in a network with millions of parameters — each weight gets its own ∂L/∂θᵢ from backprop.",
        "bestPractices": "If a partial blows up while neighbors are sane, suspect that weight's pre-activation is saturated (sigmoid/tanh near 0 or 1) or that an upstream activation just exploded. Layer-wise grad norm dashboards catch this in seconds.",
        "explanation": "Correct. A partial derivative isolates one variable's effect, holding the rest fixed — that's how backprop gets a per-weight gradient."
      },
      {
        "prompt": "At parameter θ, the gradient ∇L(θ) points in which direction?",
        "formula": "∇L(θ) = (∂L/∂θ₁, ∂L/∂θ₂, …, ∂L/∂θₙ)",
        "options": [
          "Toward the global minimum of L",
          "Perpendicular to the loss surface",
          "In the direction of steepest descent of L at θ",
          "In the direction of steepest ascent of L at θ"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "The gradient is a LOCAL property — it only knows the slope right where θ is. It has no idea where the global minimum lives, especially in a non-convex landscape full of saddles and local minima.",
          "1": "The gradient is perpendicular to LEVEL SETS (contours of constant L), not to the surface itself. Confusing level-set normals with surface normals is a common geometry slip.",
          "2": "You're off by a sign. The gradient points UP the loss surface; the NEGATIVE gradient points down. SGD subtracts the gradient precisely because the raw gradient goes the wrong way for minimization."
        },
        "whyCorrect": "By definition, ∇L is the direction in parameter space along which L increases fastest, and its magnitude is that maximum rate of increase. Any other direction has a smaller directional derivative; the opposite direction (−∇L) is steepest descent. That's why minimizers move against the gradient.",
        "bestPractices": "When ‖∇L‖ becomes tiny mid-training (not at convergence), you're likely in a flat region or saddle. Momentum or Adam helps you coast through; pure SGD can stall. Plot grad-norm over steps to spot stalls early.",
        "explanation": "Correct. ∇L points up the steepest slope. SGD negates it to step downhill toward lower loss."
      },
      {
        "prompt": "For y = f(g(x)), the chain rule says dy/dx equals:",
        "formula": "dy/dx = (dy/dg) · (dg/dx)",
        "options": [
          "dy/dg + dg/dx",
          "(dg/dy) · (dx/dg)",
          "dy/dg only — the inner function drops out",
          "(dy/dg) · (dg/dx)"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "Addition is the rule for SUMS of functions ((f+g)' = f' + g'), not composition. Composing functions multiplies their local rates because effects stack multiplicatively through layers.",
          "1": "You inverted the derivatives. dg/dy and dx/dg are the wrong objects entirely — there's no guarantee g is invertible, and even when it is, this combination doesn't equal dy/dx.",
          "2": "Dropping dg/dx would mean the inner function's sensitivity to x doesn't matter — but it absolutely does. Backprop fails the moment you forget to multiply by the inner Jacobian."
        },
        "whyCorrect": "Composition multiplies local sensitivities: x nudges g by dg/dx, and that nudge to g moves y by dy/dg. Stack those two linear effects and you multiply them. Backprop is just the chain rule applied recursively across every layer — each layer multiplies an upstream gradient by its local Jacobian.",
        "bestPractices": "Multiplying many small Jacobians causes vanishing gradients (deep nets with sigmoid/tanh); many large ones cause explosion. Use ReLU/GELU, residual connections, and gradient clipping — they're all chain-rule survival tools.",
        "explanation": "Correct. Composition multiplies rates: dy/dx = (dy/dg)·(dg/dx). Backprop is the chain rule cascaded across layers."
      },
      {
        "prompt": "In SGD, why is the update θₙ₊₁ = θₙ − η · ∇L(θₙ) — why subtract the gradient instead of adding it?",
        "formula": "θₙ₊₁ = θₙ − η · ∇L(θₙ)",
        "options": [
          "Subtraction is computationally cheaper than addition on GPUs",
          "It's a convention — adding works equally well",
          "It cancels out the bias term in the gradient",
          "∇L points uphill"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "GPUs don't care — subtraction and addition cost the same FLOP. This isn't a hardware optimization; it's about which direction reduces loss.",
          "1": "Adding the gradient would do gradient ASCENT — climbing the loss surface, making the model worse every step. The sign is mathematically required, not stylistic.",
          "2": "There's no bias-cancelling magic in the sign. Bias parameters get the same θ − η·∇L treatment as weights; the minus sign is about descent geometry, not algebraic cancellation."
        },
        "whyCorrect": "∇L is the direction of steepest INCREASE in loss, so −∇L is steepest decrease. Stepping by −η·∇L moves θ to a (locally) lower-loss point, with η controlling step size. Flip the sign and you'd be running gradient ascent — maximizing loss, which is what you'd do to find adversarial examples, not to train. Subtracting it moves θ downhill, lowering the loss.",
        "bestPractices": "Tune η as the single most important knob: too large overshoots, too small crawls. Start with Adam at η = 1e-3 or SGD+momentum at η = 1e-2, then use a schedule (cosine, step decay) to anneal as you near a minimum.",
        "explanation": "Correct. The gradient points uphill, so we negate it to descend. η controls how big a step we take in that downhill direction."
      }
    ]
  },
  "math-probability": {
    "title": "Probability for ML",
    "questions": [
      {
        "prompt": "A test for a rare disease (1% prevalence) is 99% sensitive and 99% specific. You test positive. What's the probability you actually have the disease?",
        "formula": "P(D|+) = P(+|D)·P(D) / P(+)",
        "options": [
          "About 99%",
          "About 0.99 × 0.01 = 0.99%",
          "About 1%",
          "About 50%"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "You're reading the test's sensitivity (P(+|D) = 0.99) as if it were the posterior (P(D|+)). This is the classic 'confusing the conditional' — they're only equal when the prior is 50/50.",
          "1": "You multiplied prior × sensitivity but skipped Bayes' denominator P(+). Without normalizing by the total probability of a positive test, the answer isn't a valid probability.",
          "2": "1% is the base rate (prior P(D)), not the posterior. The positive test result should move you UP from 1%; you just don't move as far as intuition suggests."
        },
        "whyCorrect": "Bayes: P(D|+) = (0.99 · 0.01) / (0.99 · 0.01 + 0.01 · 0.99) = 0.0099 / 0.0198 ≈ 0.5. Of every 10,000 people, ~99 true positives and ~99 false positives — half the positives are wrong because the rare disease's true cases get matched 1-for-1 by the test's small false-positive rate applied to the huge healthy population.",
        "bestPractices": "Whenever you see a 'highly accurate' classifier on rare events, mentally run Bayes with the base rate. In production ML — fraud, churn, medical triage — calibrate posterior probabilities against the prior, and report PR-AUC, not raw accuracy."
      },
      {
        "prompt": "Why do ML systems maximize log-likelihood instead of likelihood directly?",
        "formula": "log ∏ᵢ p(xᵢ|θ) = ∑ᵢ log p(xᵢ|θ)",
        "options": [
          "Log-likelihood gives a different optimum than likelihood, and the log optimum generalizes better",
          "Log is the only monotonic transform allowed by maximum-likelihood theory",
          "Logarithms are required by the chain rule for backpropagation",
          "Products of many small probabilities underflow to 0"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "Log is monotonic, so argmax log L(θ) = argmax L(θ) — same optimum, not a different one. Generalization isn't why we log; numerical stability and additive gradients are.",
          "1": "Any strictly monotonic transform preserves the argmax. We pick log specifically because it converts products to sums and tames floating-point underflow, not because it's mathematically privileged.",
          "2": "Backprop doesn't require logs — it works on any differentiable composition. We log the likelihood for stability and gradient-shape reasons, not because autograd demands it."
        },
        "whyCorrect": "A dataset of n points gives a likelihood ∏ᵢ p(xᵢ|θ). For n = 1000 and typical p ≈ 0.001, that product is 10⁻³⁰⁰⁰ — underflows to zero in float64. Taking log turns it into ∑ᵢ log p(xᵢ|θ), which stays in a sane numeric range AND gives per-example gradients that decompose nicely across mini-batches. Sums of logs are numerically stable and turn the product into an additive loss.",
        "bestPractices": "Always work in log-space for probabilistic losses: use log-softmax + NLL instead of softmax + log, and prefer logsumexp over log(sum(exp(·))) to avoid overflow. Cross-entropy loss in PyTorch/TF already does this for you — don't compose it manually."
      },
      {
        "prompt": "You estimate parameter θ with a Gaussian posterior centered at 5 with std 0.1, but the posterior also has a long right tail. The expectation E[θ|data] is 7. Which estimate should a control system use to minimize expected squared error?",
        "formula": "MAP = argmax p(θ|data),  E[θ] = ∫ θ · p(θ|data) dθ",
        "options": [
          "MAP = 5, because it's the most probable value",
          "Whichever has smaller variance",
          "The midpoint (5+7)/2 = 6, as a compromise",
          "E[θ] = 7, because it minimizes expected squared error"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "MAP is the MODE — the single most likely point. It minimizes 0-1 loss (right or wrong), not squared error. For skewed posteriors the mode and mean diverge, and using the mode under squared-error cost leaves accuracy on the table.",
          "1": "Variance is a property of the posterior, not a selection rule. Picking the lower-variance estimator confuses 'how certain am I?' with 'what's my best guess under this loss function?'",
          "2": "Averaging two point estimates isn't a Bayes-optimal procedure under any standard loss. It looks like a 'safe compromise' but minimizes nothing in particular."
        },
        "whyCorrect": "Under squared-error loss L(θ̂, θ) = (θ̂ − θ)², the Bayes-optimal estimator is the posterior MEAN, E[θ|data]. MAP minimizes 0-1 loss; the mean minimizes squared error; the median minimizes absolute error. Different losses → different optimal point estimates, even from the same posterior.",
        "bestPractices": "Always match the point estimate to the downstream cost: MAP for classification (0-1 loss), posterior mean for regression / control (squared error), posterior median for robust regression (absolute error). When the posterior is skewed, MAP vs mean can disagree by a lot — that's a signal you should propagate the full distribution, not collapse it."
      },
      {
        "prompt": "In Bayesian inference, you have a strong prior centered at θ = 0 and observe 10,000 data points strongly suggesting θ ≈ 1. What does the posterior look like?",
        "formula": "p(θ|data) ∝ p(data|θ) · p(θ)",
        "options": [
          "Centered near 0 — the prior dominates because it came first",
          "Undefined, because prior and likelihood disagree",
          "A 50/50 mixture of the prior and likelihood",
          "Centered near 1"
        ],
        "answer": 3,
        "whyWrong": {
          "0": "Priors don't 'come first' in the strength sense — they get DROWNED by enough data. With 10,000 observations the likelihood term scales with n while the prior stays fixed; the posterior tracks the data.",
          "1": "Disagreement between prior and likelihood is exactly the situation Bayes is designed for. The posterior is always well-defined as long as p(data|θ) · p(θ) is integrable; the data simply tells you the prior was wrong.",
          "2": "Bayes' rule multiplies prior and likelihood, it doesn't average them. There's no '50/50 mixture' rule; the posterior weights them by how peaked each one is, and a sharp likelihood from n=10,000 is far more peaked than a fixed prior."
        },
        "whyCorrect": "Log posterior = log prior + ∑ᵢ log p(xᵢ|θ). The likelihood sum grows linearly with n, while log p(θ) is fixed. As n → ∞, the posterior concentrates on the maximum-likelihood estimate regardless of the prior (this is the Bernstein-von Mises theorem). With 10,000 strong observations, the prior at θ=0 is effectively a rounding error. The likelihood overwhelms the prior as data grows.",
        "bestPractices": "Use informative priors when data is scarce (cold-start recommenders, small clinical trials) and let them fade naturally as n grows. If your prior is still dominating at n=10K, it's probably too strong — check by plotting posterior vs prior, or run a sensitivity analysis swapping the prior's variance."
      },
      {
        "prompt": "A model outputs P(spam|email) = 0.7 for a given email. Yesterday's base rate of spam was 10%; today it jumped to 60%. Should the same email's spam probability change?",
        "formula": "P(spam|email) = P(email|spam)·P(spam) / P(email)",
        "options": [
          "No — the classifier output is a property of the email itself",
          "Only if you retrain the model on today's data",
          "Yes — the posterior depends on the prior P(spam), so a shifted base rate shifts the answer",
          "No, because P(email|spam) hasn't changed"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Treating classifier output as intrinsic to the email confuses P(email|spam) (a property of spam-generating processes) with P(spam|email) (a posterior that depends on the prior). The posterior is NOT a fixed property of the input.",
          "1": "Retraining isn't required — you can adjust posteriors analytically by reweighting with the new prior ratio. This is called prior correction or threshold shifting and avoids re-fitting the whole model.",
          "3": "P(email|spam) being unchanged is exactly WHY the posterior must change: with the same likelihood but a higher prior P(spam), Bayes' rule pushes P(spam|email) up. Constant likelihood plus shifted prior equals shifted posterior."
        },
        "whyCorrect": "By Bayes' rule, P(spam|email) = P(email|spam) · P(spam) / P(email). The likelihood ratio P(email|spam) / P(email|ham) is a property of the email; the posterior multiplies it by the prior odds P(spam)/P(ham). Six-fold higher prior → roughly six-fold higher posterior odds → a meaningfully higher P(spam|email) for the same email.",
        "bestPractices": "When deploying classifiers across changing base rates (spam waves, fraud bursts, seasonal churn), recalibrate posteriors with the new prior: logit_new = logit_old + log(prior_new/prior_old) − log((1−prior_new)/(1−prior_old)). Monitor base-rate drift as a first-class metric alongside accuracy — your decision threshold should move with it."
      }
    ]
  },
  "ai-transformers": {
    "title": "Transformers from Scratch",
    "questions": [
      {
        "prompt": "In scaled dot-product attention, why do you divide QKᵀ by √d_k before the softmax?",
        "formula": "Attention(Q,K,V) = softmax(QKᵀ / √d_k) · V",
        "options": [
          "To normalize the attention weights so they sum to 1",
          "To make Q and K have unit length",
          "To keep the dot-product variance ≈ 1 so softmax doesn't saturate into a one-hot",
          "To reduce the computational cost from O(n²) to O(n log n)"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The softmax itself is what makes attention weights sum to 1. Dividing by √d_k happens BEFORE softmax — it controls the magnitude of the logits, not their normalization.",
          "1": "Scaling the dot product by a scalar doesn't change Q or K's lengths — those vectors are untouched. You'd need to L2-normalize Q and K row-wise (cosine attention) for that, which is a different design.",
          "3": "Attention is O(n²·d_k) regardless of the 1/√d_k scaling. The scale factor is a numerical stability trick, not a complexity optimization — that's what Flash/linear attention variants are for."
        },
        "whyCorrect": "If q and k are random vectors with variance 1, their dot product qᵀk has variance d_k — so logits grow with dimension. At d_k = 64 the logits scatter wide, softmax saturates to nearly one-hot, and gradients through the non-selected positions vanish. Dividing by √d_k rescales the variance back to ≈ 1 so softmax stays in its useful (non-saturated) regime.",
        "bestPractices": "If you ever build custom attention (different similarity, learned temperature), keep the 1/√d_k or its equivalent — losing it is a top reason custom attention fails to train. Watch attention entropy during training; near-zero entropy on layer 1 is your saturated-softmax signal."
      },
      {
        "prompt": "A self-attention layer processes a sequence of length n with hidden dim d. What dominates compute as n grows?",
        "formula": "FLOPs ≈ O(n² · d)  — from QKᵀ and softmax·V",
        "options": [
          "O(n · d²) — projections to Q, K, V dominate",
          "O(n · d) — linear in sequence length",
          "O(n² · d) — pairwise attention scores dominate",
          "O(n³) — three nested matmuls"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The Q/K/V projections ARE O(n·d²) and they dominate for SHORT sequences (n < d). But the question asks what dominates as n grows — at long context, n² overtakes d² and attention wins.",
          "1": "O(n·d) would be the per-token feedforward cost if attention were free. Attention's QKᵀ produces an n×n matrix — that materialization alone is n² memory before any FLOPs.",
          "3": "There's no third nested matmul. QKᵀ is one matmul (n×d times d×n → n×n), softmax·V is another (n×n times n×d → n×d). That's n²·d, not n³."
        },
        "whyCorrect": "QKᵀ produces an n×n attention matrix at cost n²·d_k, and multiplying it by V costs another n²·d_k. Both compute AND the materialized n×n scores scale quadratically with sequence length. This is exactly why doubling context from 4K to 8K quadruples attention work (4×), and why 1M-token context is a memory wall, not just a compute wall.",
        "bestPractices": "When n dominates, reach for FlashAttention (tiles the n×n matrix so it never materializes in HBM), sliding-window attention, or KV-cache strategies. Profile: if attention is < 30% of step time at your n, optimize the FFN first — it's still d² heavy."
      },
      {
        "prompt": "You have 8 heads with d_model = 512. What is d_k per head, and why split instead of using one big head?",
        "formula": "d_k = d_model / h = 512 / 8 = 64",
        "options": [
          "d_k = 512 per head; splitting just saves memory",
          "d_k = 4096 per head; heads concatenate inputs before attending",
          "d_k = 64 per head",
          "d_k = 8 per head; one dimension per head"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "If each head used the full 512 dims you'd pay 8× the attention cost AND lose the multi-head benefit. The whole point is to split d_model so total compute stays comparable to single-head while gaining representational diversity.",
          "1": "Heads don't concatenate inputs — they SPLIT them. Each head sees the full sequence but only a d_model/h slice of the channel dimension. The concatenation happens on the OUTPUT side, after each head's attended values.",
          "3": "d_k = 1 per head would give you 8 heads of scalar attention — nearly useless. d_k must be large enough to express a meaningful similarity space; 64 is the canonical choice that balances expressiveness with parallelism."
        },
        "whyCorrect": "Multi-head splits d_model across h heads (d_k = d_model/h = 64), so each head learns to attend on a different projection of the input — one head might track syntax, another coreference, another positional patterns. Total parameter and FLOP cost is almost identical to a single d_model head, but you get h parallel attention patterns that the output projection then mixes. Multiple heads attend to different subspaces in parallel.",
        "bestPractices": "Keep d_k ≥ 32 — heads with d_k = 8 or 16 underperform because the similarity space is too cramped. If you scale d_model up, scale heads up too (GPT-3 uses 96 heads at d_model = 12288, keeping d_k = 128). For inference, grouped-query attention (GQA) shares K/V across heads to shrink the KV cache."
      },
      {
        "prompt": "Why does a transformer need positional encoding at all?",
        "formula": "x_pos = x + PE(pos)   where PE(pos,2i) = sin(pos/10000^(2i/d))",
        "options": [
          "To make training faster by giving the model a head start",
          "To normalize input embeddings to unit variance",
          "Self-attention is permutation-equivariant",
          "Because softmax requires sorted inputs"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Positional encoding isn't a convergence trick — it adds information the architecture literally cannot recover otherwise. Removing PE doesn't just slow training; it breaks any task that depends on word order.",
          "1": "Variance normalization is what LayerNorm does. Sinusoidal PE adds a deterministic vector to the embedding — it doesn't standardize the input distribution.",
          "3": "Softmax is invariant to input order — it operates element-wise then normalizes. There's no sorting requirement anywhere in attention."
        },
        "whyCorrect": "Self-attention computes weighted sums over the set of tokens — if you shuffle the input sequence, the output shuffles identically (permutation-equivariant). Without injecting position, the model has no way to tell token 1 from token 100. Sinusoidal or learned PE breaks that symmetry by adding a position-dependent vector to each embedding, so 'dog bites man' and 'man bites dog' produce different attention patterns. Without PE, 'dog bites man' = 'man bites dog'.",
        "bestPractices": "For short fixed contexts, learned absolute PE is fine. For long context or extrapolation beyond training length, prefer RoPE (rotary) or ALiBi — they encode relative position and extrapolate far better than sinusoidal absolute PE. Always test position-sensitive tasks (needle-in-haystack) when changing PE schemes."
      },
      {
        "prompt": "You scale a transformer from 2K to 32K context. Activation memory for attention scores jumps by what factor?",
        "formula": "mem(scores) ∝ n² · h  per layer",
        "options": [
          "16× — linear in n",
          "4096× — cubic in n",
          "256× — quadratic in n",
          "Unchanged — KV cache handles it"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "16× would be linear scaling, but the n×n attention score matrix is quadratic in n. 16× is the factor for the KV cache or the input token count — not the attention matrix.",
          "1": "Cubic would require three sequence-length dimensions in the activation. The score matrix is n × n, so two — exactly quadratic.",
          "3": "KV cache helps INFERENCE by avoiding recomputation, but it doesn't change the n×n attention matrix you materialize during the forward pass. The cache itself also grows linearly in n, which is its own problem at long context."
        },
        "whyCorrect": "The attention score matrix is n × n per head per layer, so memory scales as n². Going from n = 2048 to n = 32768 is a 16× increase in sequence length, but 16² = 256× in attention memory. This is why 32K+ context training without FlashAttention OOMs even on H100s — the materialized scores alone can exceed the model weights.",
        "bestPractices": "FlashAttention tiles the n×n matrix into SRAM-sized blocks so it's never fully materialized — making long context memory-feasible without changing math. Combine with gradient checkpointing to trade compute for activation memory; for inference, paged KV cache (vLLM) avoids fragmentation."
      }
    ]
  },
  "ai-evaluation": {
    "title": "ML Model Evaluation",
    "questions": [
      {
        "prompt": "A fraud detector flags 100 transactions. 30 are real fraud, 70 are false alarms. There were 50 true fraud cases in the period. What are precision and recall?",
        "formula": "precision = TP / (TP + FP)   recall = TP / (TP + FN)",
        "options": [
          "Precision = 0.30, Recall = 0.30",
          "Precision = 0.60, Recall = 0.30",
          "Precision = 0.30, Recall = 0.60",
          "Precision = 0.43, Recall = 0.43"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Treats precision and recall as the same denominator. Precision uses what you PREDICTED (100), recall uses what actually EXISTED (50) — they almost never collapse to the same number.",
          "1": "Swaps the two metrics. The picker likely put TP/actual on top for precision and TP/predicted on top for recall — the definitions reversed.",
          "3": "Looks like an F1-ish blend (harmonic mean of 0.30 and 0.60 ≈ 0.40). F1 is a SUMMARY of P and R, not the value of either one individually."
        },
        "whyCorrect": "Precision = TP / predicted positives = 30/100 = 0.30 — of everything you flagged, 30% was real fraud. Recall = TP / actual positives = 30/50 = 0.60 — of the fraud that existed, you caught 60%. They have different denominators on purpose: precision answers \"can I trust an alert?\", recall answers \"am I missing cases?\".",
        "bestPractices": "Always state which class \"positive\" refers to and report both metrics together — a single number hides the tradeoff. Pick the operating point by cost: high-recall when missing a case is expensive (cancer screen), high-precision when false alarms are expensive (auto-blocking accounts).",
        "explanation": "Precision is TP over predicted positives (30/100); recall is TP over actual positives (30/50). Different denominators, different questions."
      },
      {
        "prompt": "You have a credit-default model evaluated on a dataset where 1% of customers actually default. Which curve is the more honest evaluation tool?",
        "formula": "ROC = TPR vs FPR     PR = Precision vs Recall",
        "options": [
          "ROC-AUC — it's the industry standard and threshold-independent",
          "PR-AUC — ROC-AUC inflates under heavy class imbalance",
          "Both are identical for binary classifiers",
          "Neither — use raw accuracy because the test set is large"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "\"Industry standard\" is doing the talking, not the math. ROC plots TPR vs FPR, and FPR = FP/N stays tiny when N (negatives) is huge — even a useless model can post AUC ≈ 0.9 on 1% prevalence data.",
          "2": "ROC and PR ask different questions. ROC ignores prevalence; PR bakes it in. They only agree near balanced classes — exactly the regime credit risk is NOT in.",
          "3": "Test set size doesn't fix the imbalance problem. Predicting \"no default\" for everyone scores 99% accuracy on a 1%-prevalence set while catching zero defaulters."
        },
        "whyCorrect": "PR-AUC uses precision (TP / (TP+FP)), which moves sharply when false positives grow relative to a tiny positive class. ROC-AUC uses FPR (FP/N) which barely budges when N dominates, so it stays optimistically high. On rare-event problems PR-AUC reflects what production actually feels: alert fatigue and missed cases.",
        "bestPractices": "Default to PR-AUC whenever the positive class is below ~10%. Report the operating-point precision and recall too — an AUC summary smooths over the threshold you'll actually deploy.",
        "explanation": "ROC-AUC is too forgiving under class imbalance because FPR has a giant denominator. PR-AUC tracks what production cares about."
      },
      {
        "prompt": "Your spam classifier outputs probability 0.9 on 1000 emails. Only 600 of them are actually spam. What's broken?",
        "formula": "calibration: P(y=1 | p̂ = p) ≈ p",
        "options": [
          "Accuracy is too low — retrain with more data",
          "The model is poorly calibrated",
          "Precision is below 1.0 — tighten the threshold",
          "Recall has dropped — lower the threshold"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Accuracy isn't the issue — at threshold 0.5 the model may rank fine. Calibration is about whether the PROBABILITY itself is trustworthy, which is a separate axis from accuracy.",
          "2": "Precision at the 0.9 bucket IS 0.6, but that's the symptom, not the diagnosis. Changing the threshold doesn't fix the fact that the model's 0.9 means \"actually 0.6\" — every probability is still a lie.",
          "3": "Recall and threshold tuning don't repair calibration. You'd just shift the same mis-scaled probabilities to a different operating point."
        },
        "whyCorrect": "A well-calibrated model with output p̂ = 0.9 should be right ~90% of the time on that bucket — here it's right only 60%. That's classic overconfidence: useful rankings, untrustworthy probabilities. Cost-sensitive decisions (\"is this email worth quarantining?\") rely on p̂ matching reality. It's overconfident.",
        "bestPractices": "Check calibration with a reliability diagram or Brier score, not just accuracy. Fix with Platt scaling (logistic on a holdout) or isotonic regression — modern deep nets and boosted trees almost always need a post-hoc calibration step.",
        "explanation": "0.9 should mean ~90% positive in that bucket but only 60% are. Apply Platt scaling or isotonic regression on a holdout."
      },
      {
        "prompt": "You tune 200 hyperparameter configs against your validation set and pick the best. Test-set performance is 4 points worse than val. What happened?",
        "formula": "val ≠ test once you've selected on val",
        "options": [
          "The test set is too small — collect more test data",
          "You overfit the validation set via repeated selection",
          "The model is underfit — train longer",
          "Random seed variance — re-run with different seeds"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Test set size matters for confidence intervals, but a consistent 4-point gap across 200 trials is signal, not noise. Bigger test sets won't close a real generalization gap.",
          "2": "Underfit models are bad on BOTH val and test. The fact that you tuned val performance up while test stayed put proves the model has plenty of fitting capacity — you over-used it on val.",
          "3": "Seed variance is usually <1 point on a non-tiny test set. A 4-point gap correlated with how many configs you tried is selection bias, not RNG."
        },
        "whyCorrect": "Each val evaluation is a noisy estimate of true loss. Picking the best of 200 noisy estimates selects for both real skill AND favorable noise — the val score becomes biased downward. The test set sees the unbiased reality. This is the multiple-comparisons problem applied to model selection.",
        "bestPractices": "Treat the test set as write-once: touch it ONE time at the end. Use nested cross-validation or a held-out \"final\" set you don't peek at. If you must re-tune after seeing test, you need a fresh test split — otherwise every paper number is a lie.",
        "explanation": "Best-of-N selection on val overfits val. The test set reveals the unbiased generalization gap."
      },
      {
        "prompt": "Time-series sales model: you randomly shuffle and split 80/10/10 into train/val/test. Test R² is 0.97. Production R² is 0.40. What did you do wrong?",
        "formula": "split must respect time: t_train < t_val < t_test",
        "options": [
          "The model is too complex — switch to linear regression",
          "Random shuffling leaked future information into training",
          "Test set is too small at 10%",
          "R² is the wrong metric for sales — use MAE"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Model complexity isn't the diagnosis — even a linear model would post inflated test R² under the same broken split. The 0.57-point production gap is structural, not capacity.",
          "2": "10% is a perfectly reasonable test fraction. The issue is WHICH 10%, not how much. A correctly-time-ordered 5% test set would already reveal the problem.",
          "3": "Swapping R² for MAE rescales the number but doesn't fix the cause. Whatever metric you compute on a leaked split is still inflated."
        },
        "whyCorrect": "Random shuffling puts future timestamps in train and past timestamps in test. The model learns from data it would never have at prediction time — promotional spikes, seasonality, downstream events. Production sees only the past, so the rosy test number evaporates. The split must respect the arrow of time.",
        "bestPractices": "For temporal data use forward-chaining (walk-forward) splits: train on [t₀..t₁], val on [t₁..t₂], test on [t₂..t₃]. Audit features for any column derivable only after the prediction horizon (target encoding, rolling future windows) — those are leak vectors even with correct splits.",
        "explanation": "Shuffling time series leaks future into past. Use chronological forward-chaining splits."
      }
    ]
  },
  "lab-numpy-mlp": {
    "title": "MLP from Scratch (NumPy)",
    "questions": [
      {
        "prompt": "Your input batch X has shape (32, 784) and the first hidden layer has 128 units. What shape must the weight matrix W₁ have so that X · W₁ + b₁ produces the hidden activations?",
        "formula": "Z₁ = X · W₁ + b₁,   shape(X) = (32, 784)",
        "options": [
          "(128, 784)",
          "(784, 128)",
          "(32, 128)",
          "(784, 32)"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "(128, 784) is the transpose — you would need W₁ᵀ to make the matmul conform. This is the classic 'I forgot which side multiplies' error; you can multiply but only with an extra transpose.",
          "2": "(32, 128) is the shape of the OUTPUT Z₁, not the weights. You confused the activation tensor with the parameter tensor — Z₁ has one row per example, W₁ doesn't depend on batch size at all.",
          "3": "(784, 32) bakes the batch size into the weights, which is wrong on two counts: weights must be batch-independent (32 is a property of THIS batch only), and even shape-wise the inner dims don't conform with X."
        },
        "whyCorrect": "Matrix multiplication requires inner dimensions to match: (32, 784) · (784, 128) → (32, 128). The W matrix maps from input features (784) to hidden units (128), and the batch dimension flows through untouched. Bias b₁ is shape (128,) and broadcasts across the 32 rows.",
        "bestPractices": "Print .shape after every matmul during the first hour of debugging — most NumPy MLP bugs are silent shape mismatches that broadcast into garbage. A common drill: write out (batch, in) · (in, out) → (batch, out) before you write the code.",
        "explanation": "Correct. Inner dims must match: (32, 784) · (784, 128) → (32, 128). W maps in→out; batch dim is untouched."
      },
      {
        "prompt": "During backprop, you've computed the gradient ∂L/∂Z₂ for the output layer (shape (32, 10)) and the hidden activations A₁ have shape (32, 128). What is the gradient with respect to W₂?",
        "formula": "∂L/∂W₂ = A₁ᵀ · ∂L/∂Z₂",
        "options": [
          "A₁ · (∂L/∂Z₂)ᵀ — shape (32, 32)",
          "A₁ᵀ · ∂L/∂Z₂ — shape (128, 10)",
          "∂L/∂Z₂ · A₁ — shape error",
          "(∂L/∂Z₂)ᵀ · A₁ — shape (10, 128)"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "(32, 32) is per-example outer-product nonsense. You can't update weights with a batch×batch matrix — W₂ must be shape (128, 10) so its gradient must match that.",
          "2": "Inner dimensions (10) and (32) don't conform — this is a literal shape error. You forgot you need to transpose A₁ to expose the (128) dim on the inside.",
          "3": "(10, 128) is the TRANSPOSE of the correct gradient. If you apply this in W₂ -= η · grad you'll get a shape mismatch on the update, or worse, broadcast nonsense if shapes happen to align."
        },
        "whyCorrect": "The chain rule says ∂L/∂W₂ accumulates over the batch as A₁ᵀ · ∂L/∂Z₂. Shapes: (128, 32) · (32, 10) → (128, 10), which matches W₂ exactly. The transpose on A₁ both conforms the matmul AND sums contributions across the 32 examples in the batch.",
        "bestPractices": "Always sanity-check that grad.shape == param.shape before the update step — assert it in code during development. Average vs sum across the batch is a separate choice driven by your loss reduction; matmul gives you the sum, divide by batch_size for mean.",
        "explanation": "Correct. ∂L/∂W₂ = A₁ᵀ · ∂L/∂Z₂, shape (128, 10). Matches W₂ — gradient shape must equal parameter shape."
      },
      {
        "prompt": "You replace your for-loop over examples with a single matmul over the whole batch. Why is the vectorized version typically 50-200× faster on the same CPU?",
        "formula": "for i in range(N): … →  Z = X · W",
        "options": [
          "NumPy uses a faster algorithm (Strassen) when batched",
          "BLAS routines exploit SIMD, cache locality, and multiple cores; Python loop overhead per iteration is huge",
          "Vectorized code uses less memory so the CPU runs cooler",
          "The GPU activates automatically when you batch"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "NumPy's default matmul uses standard O(n³) BLAS (GEMM), not Strassen. The win is constant-factor — hardware utilization — not algorithmic complexity.",
          "2": "Vectorized code typically uses MORE memory (you materialize the whole batch at once). Speed comes from cache reuse and SIMD, not thermals.",
          "3": "NumPy runs on CPU. There's no automatic GPU dispatch — that's what frameworks like JAX/PyTorch with .to(device) do. NumPy with no GPU stays on CPU."
        },
        "whyCorrect": "Two effects compound. (1) The Python interpreter overhead per loop iteration is roughly 100ns-1µs — multiplied by N this dominates the actual math. (2) BLAS (MKL, OpenBLAS) implements GEMM with SIMD instructions, blocked algorithms that fit in L1/L2 cache, and OpenMP threading. A single big matmul lets BLAS schedule all of that; a Python loop forces one tiny op at a time.",
        "bestPractices": "Rule of thumb: if you wrote a Python `for` loop inside a hot path, you left 10-100× on the table. Use np.einsum or broadcasting before reaching for Cython. Profile with cProfile to confirm the loop is actually the bottleneck before rewriting.",
        "explanation": "Correct. BLAS exploits SIMD and cache; Python loop overhead per iteration dwarfs the actual arithmetic at small per-step work."
      },
      {
        "prompt": "You're choosing the hidden-layer activation for a deep MLP. Why does ReLU usually train better than sigmoid in hidden layers?",
        "formula": "σ(x) = 1/(1+e⁻ˣ),   σ'(x) = σ(x)·(1−σ(x)) ≤ 0.25",
        "options": [
          "ReLU is non-linear; sigmoid is linear",
          "Sigmoid saturates at both tails so its gradient vanishes",
          "ReLU outputs are bounded in [0,1] which stabilizes training",
          "Sigmoid is slower because exp() is expensive"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Both are non-linear — sigmoid is famously a smooth S-curve, not a line. You're confusing 'non-linear' with 'unbounded'.",
          "2": "ReLU is unbounded above (0 to ∞), not [0, 1]. That's actually sigmoid's range. ReLU's lack of upper saturation is part of why its gradient stays alive.",
          "3": "exp() cost is real but minor — a few extra nanoseconds per neuron. The training failure mode of deep sigmoid nets is gradient vanishing across layers, not raw FLOP cost."
        },
        "whyCorrect": "Sigmoid's derivative peaks at 0.25 (at x=0) and decays to ~0 for |x| > 4. Stack ten sigmoid layers and the backprop gradient gets multiplied by ten values each ≤ 0.25 — you're shipping ≤ 0.25¹⁰ ≈ 10⁻⁶ to early layers, which never learn. ReLU's derivative is exactly 1 for x > 0, so gradients pass through unchanged. ReLU has gradient 1 for x > 0, so deep stacks don't choke on tiny gradients.",
        "bestPractices": "Default to ReLU (or GELU/SiLU in transformers) for hidden layers. Reserve sigmoid for output layers doing binary classification, and tanh for cases where you need centered outputs. Watch for 'dying ReLU' (neurons stuck at 0) — switch to Leaky ReLU if you see >40% dead activations.",
        "explanation": "Correct. Sigmoid's max derivative is 0.25, so gradients vanish through deep stacks. ReLU passes gradient 1 for x > 0."
      },
      {
        "prompt": "A teammate suggests dropping all bias terms b from your MLP to 'simplify the code'. What goes wrong?",
        "formula": "Z = X · W + b   vs.   Z = X · W",
        "options": [
          "Nothing — biases are just for numerical stability and a good initializer replaces them",
          "Every layer is forced to pass through the origin",
          "Training becomes faster but accuracy is unchanged",
          "The model becomes linear because biases provide the non-linearity"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Biases are not a numerical-stability hack — they're a fundamental degree of freedom. No initializer for W can reproduce what b does because W scales inputs while b adds a constant.",
          "2": "Training does get a hair faster (fewer params) but accuracy drops measurably on most tasks, especially anything where the optimal decision boundary doesn't pass through the origin in feature space.",
          "3": "Non-linearity comes from the activation function (ReLU, sigmoid), not the bias. Removing biases keeps the network non-linear; it just constrains where the activations can live."
        },
        "whyCorrect": "Without b, the affine map Z = X·W collapses to a pure linear map through the origin. If X = 0, then Z = 0 always — and after the activation, A is fixed at σ(0). The bias is what lets each neuron shift its activation function left/right along the input axis, picking WHERE on the curve it operates. Without it, every neuron's 'firing threshold' is locked at 0, which dramatically reduces expressivity. If X = 0 then Z = 0, regardless of W, so the network can't shift activations to wherever the data lives.",
        "bestPractices": "Always include biases (initialize to 0 — they don't need symmetry breaking like W does). The one exception: the layer immediately before BatchNorm/LayerNorm, since the norm's β parameter already provides the shift and a separate b would be redundant.",
        "explanation": "Correct. Without bias, every layer maps origin to origin and can't shift its activation threshold. Activation provides non-linearity; bias provides translation."
      }
    ]
  },
  "ml-nn-backprop": {
    "title": "Backprop & training",
    "questions": [
      {
        "prompt": "You compute the loss gradient w.r.t. a weight W in layer 1 of a 4-layer net. Which rule lets you propagate the error from the output all the way back to W?",
        "formula": "∂L/∂W₁ = ∂L/∂a₄ · ∂a₄/∂a₃ · ∂a₃/∂a₂ · ∂a₂/∂W₁",
        "options": [
          "Product rule — gradients multiply across independent layers",
          "Chain rule — gradients are a product of per-layer Jacobians",
          "Sum rule — gradients add layer by layer",
          "Bayes' rule — gradients update a posterior over weights"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The product rule is for differentiating a product of functions of the SAME variable (d(uv)/dx = u'v + uv'). Backprop chains COMPOSED functions, which is a different rule.",
          "2": "You sum gradients across batch examples or across paths in a DAG, but NOT across layers of a feed-forward chain. Layers compose, they don't add.",
          "3": "Bayes' rule is a probabilistic update for posteriors. It has nothing to do with how partial derivatives flow through composed functions. Picking this confuses 'updating weights' with 'updating beliefs'."
        },
        "whyCorrect": "Backprop IS the chain rule applied to a computation graph. A 4-layer net is a composition f₄∘f₃∘f₂∘f₁, so ∂L/∂W₁ is the product of the local Jacobians from the loss back to W₁. Autograd just stores these local derivatives during the forward pass and multiplies them in reverse on the backward pass.",
        "bestPractices": "When debugging exploding/vanishing gradients, inspect the per-layer Jacobian norms — the product is what blows up. PyTorch's `register_hook` on intermediate tensors lets you log gradient magnitudes layer-by-layer without changing the model.",
        "explanation": "Correct. Backprop applies the chain rule across the computation graph, multiplying local Jacobians from output back to the parameter."
      },
      {
        "prompt": "In a deep sigmoid network, training stalls — early-layer weights barely change. What's the most likely cause?",
        "formula": "σ'(x) ≤ 0.25   →   ∏ σ'(xₖ) → 0",
        "options": [
          "Learning rate is too high and updates overshoot",
          "Vanishing gradients",
          "The optimizer is using momentum, which dampens early layers",
          "Floating-point underflow in the forward pass"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "A too-high LR causes loss to OSCILLATE or diverge, not stall with healthy late-layer training. Here the gradient itself is gone before the LR ever scales it.",
          "2": "Momentum accelerates consistent directions; it doesn't selectively suppress early layers. This confuses an optimizer feature with a gradient-flow pathology.",
          "3": "Underflow can happen but it's rare in fp32 forward passes. The classical, far more common failure mode for deep sigmoid nets is gradient shrinkage from σ' ≤ 0.25, not numeric underflow."
        },
        "whyCorrect": "Sigmoid's derivative peaks at 0.25 and is much smaller in the saturating tails. Backprop multiplies one σ' per layer, so in a 10-layer net the early gradient is at best 0.25¹⁰ ≈ 10⁻⁶ of the output gradient. The signal literally dies before it reaches W₁, so those weights stop updating. Products of small σ' values collapse toward zero.",
        "bestPractices": "Swap saturating activations for ReLU/GELU, use residual connections to give gradients a shortcut path, and apply LayerNorm/BatchNorm to keep pre-activations in the non-saturating regime. Check early-layer grad norms; if they're orders of magnitude smaller than late layers, you're vanishing.",
        "explanation": "Correct. Each sigmoid layer multiplies the gradient by at most 0.25, so a long chain collapses to ≈ 0 by the time you reach the early layers."
      },
      {
        "prompt": "Why did ReLU largely replace sigmoid/tanh as the default hidden-layer activation in deep nets?",
        "formula": "ReLU'(x) = 1 if x > 0 else 0",
        "options": [
          "ReLU is differentiable everywhere, unlike sigmoid",
          "ReLU's derivative is 1 in the active region, so gradients don't shrink as they flow back",
          "ReLU outputs are bounded in [0, 1], which stabilizes training",
          "ReLU adds nonlinearity that sigmoid lacks"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Reversed: sigmoid is differentiable everywhere; ReLU is NOT (it has a kink at 0). The 'subgradient = 0' convention papers over it, but differentiability isn't ReLU's win.",
          "2": "ReLU outputs are bounded BELOW at 0 but UNBOUNDED above — that's why exploding activations also need attention with ReLU. Confusing this with sigmoid's [0,1] range.",
          "3": "Sigmoid is also nonlinear. Both activations break linearity; nonlinearity per se isn't what ReLU added. This confuses 'nonlinear' with 'gradient-friendly'."
        },
        "whyCorrect": "On the active side, ReLU'(x) = 1, so chains of ReLU derivatives don't multiplicatively shrink the gradient the way σ'(x) ≤ 0.25 does. The vanishing-gradient bottleneck breaks open, letting much deeper networks train end-to-end. The tradeoff is dead-ReLU units stuck at x ≤ 0, which Leaky/GELU variants mitigate.",
        "bestPractices": "Pair ReLU with He initialization (fan-in variance scaling) so pre-activations stay in the active region. Monitor 'dead ReLU' rate — if a unit's pre-activation is negative for the entire batch repeatedly, swap to Leaky ReLU or GELU.",
        "explanation": "Correct. ReLU's derivative is 1 in the active region, so gradient signal doesn't decay across layers — that's what unlocked deep training."
      },
      {
        "prompt": "You're computing ∂L/∂W for a weight matrix in a fully-connected layer with input x and pre-activation z = Wx + b. What is the local gradient?",
        "formula": "z = Wx + b   →   ∂L/∂W = ?",
        "options": [
          "(∂L/∂z) · W",
          "(∂L/∂z) · xᵀ",
          "(∂L/∂x) · zᵀ",
          "(∂L/∂z)² · x"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Multiplying by W computes ∂L/∂x (the gradient that gets passed BACKWARD to the previous layer), not ∂L/∂W. This is the classic 'mixed up which factor flows where' error.",
          "2": "Swaps roles of input and pre-activation — uses ∂L/∂x as the upstream signal and z as the input. The upstream gradient for W comes from z's downstream, and the input that produced z is x.",
          "3": "Squaring the upstream gradient has no derivation behind it. Chain rule is a product of first derivatives, not a square. This is pattern-matching on 'gradients squared' from RMSProp/Adam updates, which is unrelated."
        },
        "whyCorrect": "Since z = Wx + b, ∂z/∂W is essentially xᵀ (each W_ij affects only z_i, with coefficient x_j). By chain rule, ∂L/∂W = (∂L/∂z)(∂z/∂W) = (∂L/∂z) · xᵀ — an outer product of the upstream gradient and the layer's input. That's why frameworks cache x from the forward pass: it's needed verbatim on the backward pass.",
        "bestPractices": "If you're writing a custom layer, remember the backward needs the saved input — torch's `ctx.save_for_backward(x)` exists for exactly this. Activation checkpointing trades recomputing x for memory savings on very deep nets.",
        "explanation": "Correct. ∂L/∂W is the outer product of the upstream gradient ∂L/∂z and the layer input xᵀ — that's why the forward pass caches x."
      },
      {
        "prompt": "You shrink your SGD batch size from 512 to 32. What happens to per-step gradient variance and what should you do about it?",
        "formula": "Var(ĝ_batch) ∝ 1 / batch_size",
        "options": [
          "Variance drops; raise the learning rate to compensate",
          "Variance rises ~16×",
          "Variance is unchanged; batch size only affects throughput",
          "Variance rises, so you should switch from Adam to plain SGD"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Reversed direction. Smaller batches give NOISIER gradient estimates (variance ∝ 1/B), not cleaner ones. Raising LR on top of higher variance compounds the instability.",
          "2": "Batch size is a core variance knob — the mini-batch gradient is an average of B per-sample gradients, and averages have variance 1/B times the sample variance. Treating it as 'just throughput' ignores the statistics.",
          "3": "Adam adapts per-parameter step sizes using running estimates of gradient magnitude, which actually helps tolerate noisier gradients better than plain SGD. Switching toward SGD here goes the wrong direction."
        },
        "whyCorrect": "The mini-batch gradient is a sample-mean estimator, so its variance scales as σ²/B. Going from B=512 to B=32 multiplies the variance by 16×. The standard fix is to lower the LR (often by ~√16 = 4×, per the linear-scaling rule's noise-floor logic), use gradient accumulation to simulate a larger effective batch, or add a warm-up schedule so the noisy early steps don't blow up. Usually lower the LR or use gradient accumulation.",
        "bestPractices": "Tie LR to batch size — when you scale B up by k, scale LR by k (linear rule) or √k (square-root rule) and add warm-up. A bit of gradient noise can help escape saddle points, but past a threshold it just slows convergence; tune on a validation curve, not vibes.",
        "explanation": "Correct. Mini-batch gradient variance is inversely proportional to batch size, so shrinking B by 16× makes gradients ~16× noisier. Compensate with LR scaling or gradient accumulation."
      }
    ]
  },
  "ml-nn-transformers": {
    "title": "Transformers & attention",
    "questions": [
      {
        "prompt": "Self-attention scores tokens with softmax(QKᵀ/√dₖ)V. Why divide by √dₖ before the softmax?",
        "formula": "Attention(Q,K,V) = softmax(QKᵀ / √dₖ) · V",
        "options": [
          "It normalizes Q and K to unit vectors",
          "It keeps the dot-product variance from blowing up so softmax doesn't saturate",
          "It compensates for the number of heads in multi-head attention",
          "It's a learned temperature parameter that the model tunes during training"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Dividing the scalar score by √dₖ doesn't normalize Q or K — their magnitudes are unchanged. Unit-norming would be a different op (L2 normalize), and it's not what the scaling does.",
          "2": "Head count h doesn't appear in this term. Multi-head splits dₘₒdₑₗ into h pieces of size dₖ = dₘₒdₑₗ/h, but the √dₖ scaling is per-head and exists even with a single head.",
          "3": "Temperature isn't learned here — √dₖ is a fixed constant baked into the architecture. Learned temperatures exist in distillation and some retrieval setups, but not in vanilla attention."
        },
        "whyCorrect": "If Q and K entries are roughly zero-mean unit-variance, the dot product q·k of two dₖ-dim vectors has variance ≈ dₖ. Without scaling, logits grow as √dₖ and softmax pushes mass onto one token (near one-hot), killing gradients elsewhere. Dividing by √dₖ keeps logits ~O(1) so the softmax stays soft and trainable.",
        "bestPractices": "Never drop the √dₖ — it's the difference between a model that trains and one that flatlines at large dₖ. If you're rolling custom attention with weird key dims, double-check the scale; some implementations use 1/√dₖ baked into the matmul (e.g. PyTorch's scaled_dot_product_attention) and re-dividing silently halves your effective temperature."
      },
      {
        "prompt": "During autoregressive decoding you cache K and V for past tokens (KV-cache). What is the per-step compute complexity for generating token t, with sequence length so far = t and model dim d?",
        "formula": "step cost ≈ O(t · d) with KV-cache  vs  O(t² · d) without",
        "options": [
          "O(t² · d) — you recompute attention over the full prefix every step",
          "O(t · d) — you only score the new query against t cached keys/values",
          "O(d) — caching makes it independent of sequence length",
          "O(t · d²) — the FFN dominates and grows with t"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "O(t²·d) is the cost WITHOUT a cache, where you recompute K and V for every past token every step. The whole point of the KV-cache is to eliminate that quadratic redo.",
          "2": "O(d) would mean sequence length is free, which contradicts the fact that you still dot the new query against all t cached keys. Memory bandwidth on that read grows with t — that's why long contexts get slow even with a cache.",
          "3": "The FFN cost per token is O(d²) but it's constant per step (one token in, one token out). It doesn't multiply by t. The attention term is what scales with prefix length."
        },
        "whyCorrect": "With a KV-cache you only project the new token to get qₜ, kₜ, vₜ; append kₜ, vₜ to the cache; then compute attention as softmax(qₜ · K[:t]ᵀ/√dₖ) · V[:t]. That's one matmul of shape (1,d) × (d,t) → O(t·d). The total cost to generate n tokens drops from O(n³·d) to O(n²·d) — the same big-O as a single forward pass over n tokens.",
        "bestPractices": "KV-cache memory grows as 2 · n_layers · n_heads · dₖ · seq_len · batch — this is what blows up your VRAM at long context, not the weights. Use grouped-query attention (GQA) or multi-query attention (MQA) to share K/V across heads, and quantize the cache to int8/fp8 when context > 32K."
      },
      {
        "prompt": "Why is the decoder masked to be autoregressive, with attention restricted to position ≤ t?",
        "formula": "P(x₁,…,xₙ) = ∏ₜ P(xₜ | x₍₁..t₋₁₎)",
        "options": [
          "It speeds up training by halving the attention matrix",
          "It enforces the causal factorization of the joint probability so training matches inference",
          "It prevents the model from overfitting to specific positions",
          "It's required because softmax can't handle full attention matrices"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The mask zeros out the upper triangle but the matmul still computes the full QKᵀ — you don't actually save FLOPs in standard implementations. Speed isn't the reason; it's a side note at best.",
          "2": "Causal masking has nothing to do with overfitting. Position-specific overfitting is addressed by positional encodings, dropout, and data augmentation — not by masking future tokens.",
          "3": "Softmax handles any matrix shape. Full bidirectional attention is exactly what encoders (BERT) do every day. The mask is a modeling choice, not a numerical workaround."
        },
        "whyCorrect": "Language modeling factorizes P(x) = ∏ P(xₜ | x_<t). If during training token t could peek at t+1, the model would just learn to copy the answer — a trivial loss on training data and garbage at inference time, when future tokens don't exist yet. The causal mask makes the training objective identical to the inference setting: predict next token from past only.",
        "bestPractices": "If you ever see suspiciously low training loss with a decoder, check that your attention mask is strictly lower-triangular AND that your labels are shifted by one (target[t] = input[t+1]). The classic bug is forgetting the shift, which lets position t trivially predict itself."
      },
      {
        "prompt": "Pre-LN places LayerNorm BEFORE the attention/FFN sublayer (norm → attn → residual add), while Post-LN places it AFTER (attn → residual add → norm). Why do modern large transformers prefer Pre-LN?",
        "formula": "Pre-LN: y = x + Sublayer(LN(x))    Post-LN: y = LN(x + Sublayer(x))",
        "options": [
          "Pre-LN gives lower final loss on every benchmark",
          "Pre-LN keeps the residual stream unnormalized so gradients flow cleanly through deep stacks without warmup",
          "Post-LN was a bug in the original paper that was later corrected",
          "Pre-LN reduces parameter count by sharing norms across layers"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Empirically Pre-LN often gives slightly WORSE final loss at moderate depth — the original Post-LN with careful warmup can be marginally better. The win is trainability at scale, not benchmark numbers.",
          "2": "Post-LN wasn't a bug; it's what 'Attention Is All You Need' shipped and it works fine for 6-12 layer models with linear warmup. It just becomes brittle at 24+ layers.",
          "3": "Both variants use the same number of LayerNorm modules (one per sublayer). Pre-LN doesn't share or save any parameters."
        },
        "whyCorrect": "In Post-LN, the LayerNorm sits ON the residual path, so gradients backprop through n nested LNs and can vanish or explode as depth grows — you need a long LR warmup to avoid divergence. In Pre-LN, the residual stream x stays untouched (the LN is only on the sublayer branch), so ∂loss/∂x has an identity term that flows straight through n layers. That's why GPT, LLaMA, PaLM all use Pre-LN: it just trains at 80+ layers with no warmup gymnastics.",
        "bestPractices": "Default to Pre-LN for anything > 12 layers. If you must use Post-LN (e.g. matching a reference impl), add 4K-10K step linear LR warmup and watch for early-step loss spikes. RMSNorm (LLaMA-style) is a drop-in faster replacement for LN in the pre-norm slot — same stability, ~10% faster."
      },
      {
        "prompt": "In a residual stream view of a transformer, each layer reads from and writes to a shared d-dimensional vector per token. What does the attention sublayer actually contribute to the stream?",
        "formula": "xₗ₊₁ = xₗ + Attn(LN(xₗ)) + FFN(LN(xₗ + Attn(…)))",
        "options": [
          "It overwrites the residual stream with a fresh representation",
          "It adds a low-rank update that moves information BETWEEN token positions",
          "It rescales the residual stream by a learned gate",
          "It applies a nonlinearity to mix channels within each token"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "There's no overwrite — that would be y = Attn(x), not y = x + Attn(x). The residual ADD is structurally essential; killing it breaks the gradient highway and the stream metaphor.",
          "2": "Attention has no gating term in standard transformers (it's not GLU). You're thinking of gated variants like Mamba/SSMs or gated FFNs (SwiGLU) — but the attention sublayer itself just adds, not multiplies.",
          "3": "Channel mixing within a single token is what the FFN does (point-wise MLP). Attention's whole job is the OPPOSITE — moving information across tokens. Confusing the two is a classic mental model bug."
        },
        "whyCorrect": "The residual stream is the d-dim vector each token carries through depth. Attention reads it via LN, computes Wₒ · softmax(QKᵀ/√dₖ) · V — a rank-bounded update because the value/output projections compress through dₖ < d — and ADDS that update back. Crucially, the update at position t is a weighted sum of OTHER tokens' values, so attention is the only operation in a transformer that moves information across positions. FFN does the per-token channel mixing.",
        "bestPractices": "When debugging what a head does, look at its OV (output-value) circuit and QK (query-key) circuit separately — QK decides which tokens to read from, OV decides what to write to the stream. Mechanistic interp tools like TransformerLens expose these directly; it beats staring at raw attention heatmaps."
      }
    ]
  }
};
