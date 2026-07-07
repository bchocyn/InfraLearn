export default {
  "math-linalg": {
    "sections": [
      {
        "heading": "Why linear algebra runs ML",
        "body": [
          {
            "type": "p",
            "text": "Every model you'll touch — linear regression, transformers, diffusion — is a **stack of linear transforms** glued together with nonlinearities. If you can't see a matrix as *a function that moves vectors around*, the rest of ML stays opaque."
          },
          {
            "type": "p",
            "text": "Forget proofs. You need four mental images: **vectors as arrows**, **matrices as transformations**, **dot product as similarity**, and **eigenvectors as the axes that don't rotate**. Get those, and the math under any architecture stops feeling like wizardry."
          }
        ]
      },
      {
        "heading": "The core objects",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Vector",
                "def": "An ordered list of numbers — a point in ℝⁿ, or equivalently an arrow from the origin. A 768-dim embedding is just a vector in ℝ⁷⁶⁸."
              },
              {
                "term": "Matrix",
                "def": "A rectangular grid of numbers, but *think* of it as a function: feed it a vector, get a transformed vector back."
              },
              {
                "term": "Dot product",
                "def": "Sum of elementwise products. Measures alignment: large positive = pointing the same way, zero = perpendicular, negative = opposing."
              },
              {
                "term": "Rank",
                "def": "The number of independent directions a matrix actually uses. A 1000×1000 matrix with rank 3 is secretly tiny — that's why LoRA works."
              },
              {
                "term": "Eigenvector",
                "def": "A vector that a matrix only *stretches*, never rotates. The stretch factor is its eigenvalue."
              }
            ]
          }
        ]
      },
      {
        "heading": "Geometry of a linear transform",
        "body": [
          {
            "type": "p",
            "text": "A 2×2 matrix `A` takes the unit square and maps it to a parallelogram. Columns of `A` are where the basis vectors **î** and **ĵ** land. Everything else follows by linearity."
          },
          {
            "type": "diagram",
            "title": "Matrix A acting on basis vectors",
            "nodes": [
              {
                "id": "i",
                "label": "î = (1,0)",
                "subtitle": "input basis",
                "x": 0.1,
                "y": 0.7,
                "accent": "water"
              },
              {
                "id": "j",
                "label": "ĵ = (0,1)",
                "subtitle": "input basis",
                "x": 0.1,
                "y": 0.3,
                "accent": "water"
              },
              {
                "id": "A",
                "label": "A = [[2,1],[0,3]]",
                "subtitle": "the transform",
                "x": 0.5,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "i2",
                "label": "(2,0)",
                "subtitle": "column 1 of A",
                "x": 0.9,
                "y": 0.7,
                "accent": "amber"
              },
              {
                "id": "j2",
                "label": "(1,3)",
                "subtitle": "column 2 of A",
                "x": 0.9,
                "y": 0.3,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "i",
                "to": "A",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "j",
                "to": "A",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "A",
                "to": "i2",
                "kind": "dashed",
                "accent": "fire",
                "label": "stretches î"
              },
              {
                "from": "A",
                "to": "j2",
                "kind": "dashed",
                "accent": "fire",
                "label": "shears ĵ"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Determinant** is the area of that parallelogram — how much `A` scales space. Negative determinant means `A` flipped orientation. Zero determinant means `A` **squashed space into a lower dimension** — that's a rank-deficient matrix, and it's not invertible."
          }
        ]
      },
      {
        "heading": "NumPy: feel the shapes",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np\n\nx = np.array([1.0, 2.0, 3.0])  # shape (3,) — 1D vector, no row/col\nW = np.array([[1, 0, 2],\n              [0, 1, 1]])  # shape (2, 3) — maps ℝ³ → ℝ²\n\ny = W @ x  # shape (2,) — matrix-vector mult\n# y[i] = dot(W[i], x) — each output is a dot product\n\nsim = x @ x  # 14.0 — dot with self = ‖x‖²\ncos = (x @ y) / (np.linalg.norm(x)*np.linalg.norm(y))  # cosine similarity\n\nr = np.linalg.matrix_rank(W)  # 2 — both rows independent\nvals, vecs = np.linalg.eig(W @ W.T)    # eig only on square matrices\n# vecs[:, i] is the eigenvector for vals[i] — columns, not rows\n\nbatch = np.random.randn(32, 3)  # (32, 3) — 32 vectors stacked\nout = batch @ W.T  # (32, 2) — W.T because batch-first\n# rule: (B, in) @ (in, out) → (B, out)"
          },
          {
            "type": "p",
            "text": "The last line is the shape rule you'll use **a thousand times**. Inner dims must match and cancel; outer dims survive. When PyTorch yells about shapes, draw the rectangles."
          }
        ]
      },
      {
        "heading": "Where this shows up in ML",
        "body": [
          {
            "type": "table",
            "headers": [
              "Operation",
              "Where you meet it",
              "What it's doing"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "`Wx + b`",
                "Every dense layer",
                "Linear transform + shift"
              ],
              [
                "`q · k`",
                "Attention scores",
                "Dot product = how relevant is key to query"
              ],
              [
                "Low rank",
                "LoRA, PCA, embeddings",
                "Real signal lives in few directions"
              ],
              [
                "Eigendecomp",
                "PCA, spectral methods",
                "Find axes of maximum variance"
              ],
              [
                "Matrix norm",
                "Gradient clipping, stability",
                "How much a transform can amplify"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Mental models that pay off",
            "watchLabel": "Traps that bite beginners",
            "good": [
              "Read `W @ x` as 'W transforms x', not 'multiply some numbers'",
              "Treat dot product as **alignment** — it's why attention works",
              "When a matrix has low rank, it's compressible — exploit it",
              "Eigenvectors point at the directions a system naturally amplifies"
            ],
            "watch": [
              "Confusing `(3,)` with `(3,1)` or `(1,3)` — NumPy broadcasts differently",
              "Forgetting `W.T` when batches are the first dim",
              "Assuming a square matrix is invertible — check the rank",
              "Using `np.dot` on 2D arrays expecting elementwise — that's `*`"
            ]
          },
          {
            "type": "quote",
            "text": "A matrix is not a grid of numbers. It's a verb.",
            "cite": "the only sentence that matters"
          }
        ]
      }
    ]
  },
  "math-calculus": {
    "sections": [
      {
        "heading": "Derivatives are just slopes",
        "body": [
          {
            "type": "p",
            "text": "A **derivative** answers one question: *if I nudge the input a tiny bit, how much does the output change?* That ratio — Δoutput / Δinput as Δinput → 0 — is the **slope of the function at that point**."
          },
          {
            "type": "p",
            "text": "For `f(x) = x²`, the derivative is `f'(x) = 2x`. At `x = 3` the slope is `6`: bump x by `0.001` and y jumps by roughly `0.006`. That's it. Every ML optimizer is built on this one idea, scaled up to millions of dimensions."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Derivative",
                "def": "Slope of a single-input function — one number telling you rise over run at a point."
              },
              {
                "term": "Partial derivative",
                "def": "Slope along ONE axis while pinning every other input fixed — written ∂f/∂x."
              },
              {
                "term": "Gradient (∇f)",
                "def": "Vector of every partial derivative stacked together — points in the direction of steepest ascent."
              },
              {
                "term": "Chain rule",
                "def": "If `y = f(g(x))`, then `dy/dx = f'(g(x)) · g'(x)` — multiply the slopes of nested functions."
              }
            ]
          }
        ]
      },
      {
        "heading": "Partials and the gradient",
        "body": [
          {
            "type": "p",
            "text": "A loss function in ML doesn't take one number — it takes **thousands of weights**. You can't draw a single slope. Instead you ask: *if I wiggle weight w₁ alone, holding the rest still, how does loss change?* That's the **partial derivative** ∂L/∂w₁."
          },
          {
            "type": "p",
            "text": "Stack every partial into a vector and you get the **gradient** ∇L. For `L(w₁, w₂) = w₁² + 3w₂²`, the gradient is `[2w₁, 6w₂]`. At `(1, 1)` it's `[2, 6]` — meaning loss climbs **3× faster** along w₂ than w₁ from that spot."
          },
          {
            "type": "quote",
            "text": "The gradient is a compass that always points uphill — its length tells you how steep the hill is.",
            "cite": "the only mental model you need"
          },
          {
            "type": "p",
            "text": "Key fact: **∇L points in the direction of steepest ASCENT.** Not descent. This single sign convention is why the next section matters."
          }
        ]
      },
      {
        "heading": "Why SGD subtracts the gradient",
        "body": [
          {
            "type": "p",
            "text": "Training wants to **minimize** loss. The gradient points uphill. So to walk downhill, you step in the **opposite** direction. That's the entire derivation of gradient descent — it is not a trick, it is a sign."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "w = w - eta * grad_L  # subtract — opposite of steepest ascent\n# eta is the learning rate (step size, usually 1e-3 to 1e-1)\n# grad_L came from backprop — it points UPHILL on the loss surface\n# adding would maximize loss; subtracting minimizes it"
          },
          {
            "type": "p",
            "text": "The **learning rate** η controls step length. Too small: you crawl. Too large: you overshoot the valley and bounce off the opposite wall, possibly diverging. Picking η is more art than calculus — but the *direction* is pure math."
          },
          {
            "type": "diagram",
            "title": "One SGD step on a loss surface",
            "nodes": [
              {
                "id": "w",
                "label": "current w",
                "subtitle": "loss = 4.2",
                "x": 0.15,
                "y": 0.7,
                "accent": "amber"
              },
              {
                "id": "grad",
                "label": "∇L",
                "subtitle": "points uphill",
                "x": 0.5,
                "y": 0.15,
                "accent": "fire"
              },
              {
                "id": "neg",
                "label": "−η·∇L",
                "subtitle": "the actual step",
                "x": 0.5,
                "y": 0.85,
                "accent": "water"
              },
              {
                "id": "wnew",
                "label": "new w",
                "subtitle": "loss = 3.7",
                "x": 0.85,
                "y": 0.7,
                "accent": "sky"
              }
            ],
            "edges": [
              {
                "from": "w",
                "to": "grad",
                "kind": "dashed",
                "accent": "fire",
                "label": "compute"
              },
              {
                "from": "grad",
                "to": "neg",
                "kind": "solid",
                "accent": "water",
                "label": "flip sign"
              },
              {
                "from": "w",
                "to": "wnew",
                "kind": "dashed",
                "accent": "sky",
                "label": "w − η·∇L"
              }
            ]
          }
        ]
      },
      {
        "heading": "Chain rule — the engine of backprop",
        "body": [
          {
            "type": "p",
            "text": "Neural nets are **stacks of nested functions**: `loss(softmax(linear(relu(linear(x)))))`. To get ∂loss/∂(first weight), you multiply the local slopes back through every layer. That's the **chain rule**, applied mechanically."
          },
          {
            "type": "p",
            "text": "Example: `y = (3x + 1)²`. Let `u = 3x + 1`, so `y = u²`. Then `dy/dx = dy/du · du/dx = 2u · 3 = 6(3x + 1)`. At `x = 2`: slope is `42`. Backprop does this for *millions* of weights, in one backward pass."
          }
        ]
      },
      {
        "heading": "Numerical gradient: finite differences",
        "body": [
          {
            "type": "p",
            "text": "You rarely compute gradients by hand — autograd does it. But every ML engineer should know the **finite-difference check**: nudge each weight, measure loss change, divide. It is the **ground truth** you use to debug a hand-written backward pass."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np\n\ndef numerical_grad(f, x, eps=1e-5):\n    grad = np.zeros_like(x, dtype=float)   # one slot per input dimension\n    for i in range(x.size):  # walk each coordinate independently\n        orig = x.flat[i]  # cache so we can restore exactly\n        x.flat[i] = orig + eps  # nudge UP by ε\n        f_plus  = f(x)  # loss at the +ε point\n        x.flat[i] = orig - eps  # nudge DOWN by ε (symmetric)\n        f_minus = f(x)  # loss at the −ε point\n        x.flat[i] = orig  # restore — critical, else drift\n        grad.flat[i] = (f_plus - f_minus) / (2 * eps)   # central difference\n    return grad\n\nf = lambda w: (w**2).sum()  # toy loss: L = Σ wᵢ²\nw = np.array([1.0, 2.0, 3.0])  # analytic gradient is [2, 4, 6]\nprint(numerical_grad(f, w))  # → [2.0, 4.0, 6.0] ✓"
          },
          {
            "type": "p",
            "text": "Note the **central difference** `(f(x+ε) − f(x−ε)) / 2ε`. It cancels the leading error term and is accurate to O(ε²) — far better than the naive one-sided `(f(x+ε) − f(x)) / ε`."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "table",
            "headers": [
              "Pitfall",
              "Symptom",
              "Fix"
            ],
            "rows": [
              [
                "ε too large",
                "approximation error swamps signal",
                "use ε ≈ 1e-5 for float64"
              ],
              [
                "ε too small",
                "floating-point cancellation noise",
                "never go below ~1e-8"
              ],
              [
                "forgot to restore x",
                "later coords drift, gradient is garbage",
                "always reset `x.flat[i] = orig`"
              ],
              [
                "one-sided diff in tests",
                "O(ε) error masks real bugs",
                "always use central difference"
              ],
              [
                "checking on float32",
                "noise floor too high to compare",
                "promote to float64 for grad-check"
              ]
            ],
            "align": [
              "left",
              "left",
              "left"
            ]
          },
          {
            "type": "p",
            "text": "**Finite differences are O(N) function evaluations** — one per weight. Useless for training a real network with 10⁹ parameters. That's why autograd exists: it computes the exact gradient in **one** backward pass via chain rule. Finite differences stay in your toolbox as a **correctness oracle**, not a training algorithm."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Use finite differences when",
            "watchLabel": "Reach for autograd when",
            "good": [
              "Debugging a hand-written backward pass",
              "Verifying a custom loss or layer",
              "Sanity-checking a single weight on a toy net",
              "Teaching yourself what gradients actually are"
            ],
            "watch": [
              "Training any model larger than ~100 params",
              "Anything that runs more than once per epoch",
              "Production code — no exceptions",
              "Anywhere speed matters more than pedagogy"
            ]
          }
        ]
      }
    ]
  },
  "math-probability": {
    "sections": [
      {
        "heading": "Probability is the language ML speaks",
        "body": [
          {
            "type": "p",
            "text": "Every model you train is secretly fitting a **probability distribution**. Loss functions are negative log-likelihoods in disguise, regularizers are priors in disguise, and predictions are expectations in disguise. You don't need measure theory — you need fluency with five objects: **random variables**, **distributions**, **conditionals**, **Bayes**, and **expectation**."
          },
          {
            "type": "p",
            "text": "A **random variable** `X` is not a number. It's a function from outcomes to numbers, and what you actually care about is its **distribution** — the function `p(x)` that says how much mass sits at each value. Discrete `X` gets a *pmf*, continuous `X` gets a *pdf*. Both integrate (or sum) to 1."
          }
        ]
      },
      {
        "heading": "Distributions you'll meet again and again",
        "body": [
          {
            "type": "table",
            "headers": [
              "Distribution",
              "Use case",
              "Parameters",
              "Where in ML"
            ],
            "align": [
              "left",
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Bernoulli",
                "single coin flip",
                "p",
                "binary classifier output"
              ],
              [
                "Categorical",
                "k-way pick",
                "π₁..πₖ",
                "softmax head"
              ],
              [
                "Gaussian",
                "continuous noise",
                "μ, σ²",
                "regression residuals, weight init"
              ],
              [
                "Beta",
                "belief over a probability",
                "α, β",
                "Bayesian A/B priors"
              ],
              [
                "Dirichlet",
                "belief over categorical",
                "α₁..αₖ",
                "topic models, LDA"
              ],
              [
                "Exponential",
                "waiting times",
                "λ",
                "survival, hazard models"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Memorize the **shape**, not the formula. Gaussian is bell-shaped and decays fast — outliers are nearly impossible, which is why MSE loss is fragile. Laplace decays slower, which is why L1 loss handles outliers better. Loss choice = distribution assumption."
          }
        ]
      },
      {
        "heading": "Conditional probability and Bayes",
        "body": [
          {
            "type": "p",
            "text": "Conditional probability `p(A | B)` reads as *probability of A once you know B*. The slash is not division — it's an update. **Bayes' rule** is just the conditional definition rearranged so you can flip the direction of the conditioning:"
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "p(θ | data) = p(data | θ) · p(θ) / p(data)\n   posterior  =  likelihood ·  prior   / evidence"
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Prior",
                "def": "`p(θ)` — what you believed about parameters before seeing data; encodes domain knowledge or regularization."
              },
              {
                "term": "Likelihood",
                "def": "`p(data | θ)` — how plausible the observed data is under each candidate θ; this is what you maximize in MLE."
              },
              {
                "term": "Posterior",
                "def": "`p(θ | data)` — your updated belief after the data lands; the actual object Bayesian ML cares about."
              },
              {
                "term": "Evidence",
                "def": "`p(data)` — the normalizing constant; usually intractable, which is why we lean on MCMC or variational methods."
              }
            ]
          }
        ]
      },
      {
        "heading": "A worked Bayes example",
        "body": [
          {
            "type": "p",
            "text": "A test for a rare disease is **99% accurate** both ways. **0.1%** of people have the disease. You test positive. What's the chance you're sick? Most people guess 99%. The right answer is roughly **9%** — and it's the prior that crushes you."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "prior   = 0.001  # base rate — disease is rare\nsens    = 0.99  # p(+ | sick)  — true positive rate\nspec    = 0.99  # p(- | healthy) — true negative rate\nfpr     = 1 - spec  # p(+ | healthy) — what trips us up\n\n# p(+) = p(+|sick)·p(sick) + p(+|healthy)·p(healthy)\nevidence = sens*prior + fpr*(1 - prior)   # total mass on \"+\"\n\nposterior = sens * prior / evidence  # Bayes rule, one line\nprint(f\"{posterior:.3f}\")    # 0.090 — nine percent, not ninety-nine"
          },
          {
            "type": "p",
            "text": "The lesson generalizes. When the **prior is tiny**, even a strong likelihood ratio leaves the posterior small. ML version: a classifier with 99% accuracy on a 0.1% positive class is still mostly wrong about positives. Always do the Bayes arithmetic before celebrating accuracy."
          }
        ]
      },
      {
        "heading": "Expectation and log-likelihood",
        "body": [
          {
            "type": "p",
            "text": "**Expectation** `E[X] = ∑ x · p(x)` is the long-run average — the center of mass of the distribution. Linearity is your superpower: `E[aX + bY] = a·E[X] + b·E[Y]` even when X and Y are dependent. Variance is `E[(X − μ)²]`, the spread around that center."
          },
          {
            "type": "p",
            "text": "Training a model is almost always **maximizing log-likelihood** of the data under your model. Why log? Because products of tiny probabilities underflow to zero, and `log(a·b) = log(a) + log(b)` turns products into sums that gradients flow through cleanly."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np\n\n# Gaussian log-likelihood for observations x given μ, σ\ndef log_lik(x, mu, sigma):\n    n = len(x)  # sample size\n    z = (x - mu) / sigma  # standardized residuals\n    return -0.5*n*np.log(2*np.pi*sigma**2) \\\n           - 0.5*np.sum(z**2)  # sum, not product — log space\n\n# minimize negative log-lik  ≡  maximize likelihood  ≡  least squares for μ\n# because the σ term is constant in μ, and ∑z² is just scaled MSE"
          },
          {
            "type": "quote",
            "text": "MSE loss is Gaussian MLE. Cross-entropy is categorical MLE. Every loss is a likelihood wearing a costume.",
            "cite": "the trick once you see it"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Habits that pay off",
            "watchLabel": "Traps that bite",
            "good": [
              "Always work in **log space** for likelihoods — underflow is real.",
              "Sanity-check posteriors against the **prior** when classes are imbalanced.",
              "Treat your **loss function** as a distributional assumption, and question it.",
              "Use `logsumexp` instead of `log(sum(exp(...)))` for numerical stability."
            ],
            "watch": [
              "**Base rate neglect** — ignoring the prior makes 99% accurate tests useless on rare classes.",
              "**Independence assumptions** that aren't true (naive Bayes on correlated features).",
              "Confusing `p(A|B)` with `p(B|A)` — the **prosecutor's fallacy** lives here.",
              "Reporting **mean** for a skewed distribution where the **median** is what people actually want."
            ]
          }
        ]
      }
    ]
  },
  "ai-transformers": {
    "sections": [
      {
        "heading": "Attention is just weighted averaging",
        "body": [
          {
            "type": "p",
            "text": "**Self-attention** lets every token look at every other token and decide who matters. That's it. The rest is bookkeeping — projections, scaling, multiple heads — so the mechanism is **stable to train** and **expressive enough** to learn syntax, coreference, and long-range structure from raw text."
          },
          {
            "type": "p",
            "text": "Forget RNNs for a moment. A transformer block takes a sequence of vectors and outputs a sequence of the **same shape**, where each output is a *learned weighted sum* of all inputs. The weights are computed on the fly from the inputs themselves — that's the **self** in self-attention."
          }
        ]
      },
      {
        "heading": "Q, K, V: three projections of the same thing",
        "body": [
          {
            "type": "p",
            "text": "Each input token `x` gets projected three ways via learned matrices `W_Q`, `W_K`, `W_V`. You get a **query** (what am I looking for?), a **key** (what do I offer?), and a **value** (what do I actually contribute?)."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Query (Q)",
                "def": "The token's question — projected from `x` via `W_Q`, used to score every other token."
              },
              {
                "term": "Key (K)",
                "def": "The token's advertisement — dotted against queries to produce raw match scores."
              },
              {
                "term": "Value (V)",
                "def": "The token's payload — what actually gets mixed into the output once weights are known."
              },
              {
                "term": "Attention score",
                "def": "`Q · K⊤` — a matrix where entry (i,j) says how much token i should attend to token j."
              }
            ]
          },
          {
            "type": "p",
            "text": "Splitting into Q/K/V instead of using `x` directly is what lets the same token play **different roles** depending on context. A pronoun's query can hunt for an antecedent while its value carries grammatical gender."
          }
        ]
      },
      {
        "heading": "Scaled dot-product, in 20 lines",
        "body": [
          {
            "type": "p",
            "text": "Here's the whole mechanism. Read the comments — the **scaling** and the **mask** are where people trip."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import torch\nimport torch.nn.functional as F\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    # Q,K,V shape: (batch, heads, seq, d_k) — heads already split\n    d_k = Q.size(-1)  # per-head dim, NOT model dim\n\n    scores = Q @ K.transpose(-2, -1)  # (b, h, seq, seq) — every pair\n    scores = scores / (d_k ** 0.5)  # tame variance — see next section\n\n    if mask is not None:  # causal or padding mask\n        scores = scores.masked_fill(  # -inf so softmax sends it to 0\n            mask == 0, float('-inf')\n        )\n\n    weights = F.softmax(scores, dim=-1)  # rows sum to 1 — proper mixture\n    weights = F.dropout(weights, p=0.1)  # regularize the attention pattern itself\n\n    output = weights @ V  # weighted sum of value vectors\n    return output, weights  # return weights for inspection\n\n# Usage: Q,K,V come from x @ W_Q, x @ W_K, x @ W_V then reshape to heads\n# Output has same shape as Q — drop-in replacement for a sequence layer"
          },
          {
            "type": "p",
            "text": "The `√d_k` divisor is **not cosmetic**. Without it, dot products grow with dimension, softmax saturates to one-hot, and gradients die. Divide by `√d_k` and the variance stays ~1 regardless of head size."
          }
        ]
      },
      {
        "heading": "One attention block, drawn",
        "body": [
          {
            "type": "diagram",
            "title": "Scaled dot-product attention, one head",
            "height": 280,
            "nodes": [
              {
                "id": "x",
                "label": "Input x",
                "subtitle": "(seq, d_model)",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "qkv",
                "label": "W_Q, W_K, W_V",
                "subtitle": "project",
                "x": 0.3,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "score",
                "label": "Q · K⊤ / √d_k",
                "subtitle": "pairwise scores",
                "x": 0.55,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "soft",
                "label": "softmax + mask",
                "subtitle": "weights",
                "x": 0.78,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "out",
                "label": "weights · V",
                "subtitle": "mixed values",
                "x": 0.95,
                "y": 0.7,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "x",
                "to": "qkv",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "qkv",
                "to": "score",
                "kind": "dashed",
                "label": "Q,K",
                "accent": "sky"
              },
              {
                "from": "qkv",
                "to": "out",
                "kind": "dashed",
                "label": "V",
                "accent": "sky"
              },
              {
                "from": "score",
                "to": "soft",
                "kind": "dashed",
                "accent": "amber"
              },
              {
                "from": "soft",
                "to": "out",
                "kind": "dashed",
                "accent": "amber"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Multi-head attention** runs `h` of these in parallel on smaller slices (`d_model / h`), then concatenates. Different heads learn different relations — one tracks subjects, another tracks brackets, another does nothing useful and gets pruned."
          }
        ]
      },
      {
        "heading": "Position, and why O(n²) is the bill",
        "body": [
          {
            "type": "p",
            "text": "Attention is **permutation-invariant** — shuffle the input and you get the shuffled output. That's a problem for language. The fix is **positional encoding**: add a position-dependent vector to each input embedding *before* attention sees it. Sinusoidal (original paper) or learned (GPT-2) both work; **RoPE** (rotary) is the modern default for long-context models."
          },
          {
            "type": "table",
            "headers": [
              "Resource",
              "Scales as",
              "Why"
            ],
            "rows": [
              [
                "Compute (FLOPs)",
                "O(n² · d)",
                "Every token scores every other token"
              ],
              [
                "Memory (attention matrix)",
                "O(n²)",
                "Full seq × seq weight grid in RAM"
              ],
              [
                "KV cache (inference)",
                "O(n · d)",
                "Only keys/values for past tokens stored"
              ],
              [
                "Parameters",
                "O(d²)",
                "Independent of sequence length"
              ]
            ],
            "align": [
              "left",
              "center",
              "left"
            ]
          },
          {
            "type": "p",
            "text": "**Doubling context = 4× attention cost.** This is why 1M-context models lean on **FlashAttention** (tiled, no full matrix materialized), **sliding windows**, or **linear-attention** approximations. The quadratic isn't a bug — it's what gives every token unrestricted reach. You pay for that reach."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Get right",
            "watchLabel": "Easy to break",
            "good": [
              "Divide by `√d_k`, not `√d_model` — `d_k` is the *per-head* dim",
              "Mask BEFORE softmax with `-inf`, not after with zero",
              "Reshape to `(batch, heads, seq, d_k)` so the matmul broadcasts cleanly",
              "Add positional info to embeddings, not to Q/K/V projections directly"
            ],
            "watch": [
              "Forgetting the causal mask in a decoder — model peeks at the future, train loss looks great, generation is garbage",
              "Using `softmax(scores) * mask` instead of `masked_fill` — leaks probability mass",
              "Padding tokens contributing to attention — mask them too, not just causally",
              "Assuming more heads is always better — past `d_k < 32` heads get too thin to learn"
            ]
          },
          {
            "type": "quote",
            "text": "Attention is all you need — but scaled, masked, multi-headed, and positionally encoded.",
            "cite": "the fine print of Vaswani et al."
          }
        ]
      }
    ]
  },
  "ai-embeddings": {
    "cliffhanger": "Two sentences mean the same thing but have different embeddings. Why — and how do you fix it?",
    "sections": [
      {
        "heading": "Words are coordinates now",
        "body": [
          {
            "type": "p",
            "text": "An **embedding** turns a token, sentence, or image into a fixed-length **vector** of floats — typically 384, 768, or 1536 dimensions. Similar meanings land in similar regions of that space, which means you can search by *meaning* instead of by exact string match."
          },
          {
            "type": "p",
            "text": "This is the trick under semantic search, RAG, recommendations, dedup, clustering, and zero-shot classification. The model never learned the word *king* — it learned a **direction** in 768-D space that happens to behave like royalty + male."
          }
        ]
      },
      {
        "heading": "Cosine, not Euclidean",
        "body": [
          {
            "type": "p",
            "text": "You almost never compare embeddings with raw Euclidean distance. You compare **angles** using **cosine similarity**: 1.0 means same direction (synonyms), 0.0 means orthogonal (unrelated), -1.0 means opposite. Magnitude is noise — direction is meaning."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np\n\na = np.array([0.21, -0.04, 0.88, 0.31])  # 4-D toy embedding for \"dog\"\nb = np.array([0.19,  0.02, 0.91, 0.27])  # \"puppy\" — close direction\nc = np.array([-0.7,  0.6,  0.1, -0.2])  # \"forklift\" — unrelated\n\ndef cos(u, v):\n    return (u @ v) / (np.linalg.norm(u) * np.linalg.norm(v))  # dot ÷ magnitudes\n\nprint(cos(a, b))   # ~0.99 — same neighborhood\nprint(cos(a, c))   # ~-0.1 — basically orthogonal\n\n# Trick: pre-normalize once, then cosine == dot product\nA = a / np.linalg.norm(a)  # unit vector — magnitude = 1\nB = b / np.linalg.norm(b)  # now A @ B IS the cosine\nprint(A @ B)  # cheaper at query time"
          },
          {
            "type": "p",
            "text": "Pre-normalizing every vector at write time is the standard move — your hot path becomes a single **matrix-multiply**, which the GPU eats for breakfast."
          }
        ]
      },
      {
        "heading": "Why king - man + woman ≈ queen",
        "body": [
          {
            "type": "p",
            "text": "Because the training objective (predict-the-neighbor, contrastive loss, masked LM) forces consistent **offsets** for consistent relationships. The vector from `man → woman` ends up roughly parallel to `king → queen`, `actor → actress`, `uncle → aunt`. Gender becomes a **direction**, not a feature flag."
          },
          {
            "type": "diagram",
            "title": "Analogy as vector arithmetic",
            "nodes": [
              {
                "id": "man",
                "label": "man",
                "x": 0.15,
                "y": 0.75,
                "accent": "water"
              },
              {
                "id": "woman",
                "label": "woman",
                "x": 0.15,
                "y": 0.25,
                "accent": "fire"
              },
              {
                "id": "king",
                "label": "king",
                "x": 0.75,
                "y": 0.75,
                "accent": "water"
              },
              {
                "id": "queen",
                "label": "queen",
                "subtitle": "king + (woman − man)",
                "x": 0.75,
                "y": 0.25,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "man",
                "to": "woman",
                "kind": "dashed",
                "label": "gender offset",
                "accent": "amber"
              },
              {
                "from": "king",
                "to": "queen",
                "kind": "dashed",
                "label": "same offset",
                "accent": "amber"
              },
              {
                "from": "man",
                "to": "king",
                "kind": "solid",
                "label": "royalty axis",
                "accent": "earth"
              },
              {
                "from": "woman",
                "to": "queen",
                "kind": "solid",
                "label": "royalty axis",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "Don't oversell it — modern transformer embeddings are messier than the classic word2vec demo, and analogy accuracy off the shelf is often **mediocre**. The geometry exists; it's just not as clean as the slides suggest."
          }
        ]
      },
      {
        "heading": "Dimensionality — pick the right size",
        "body": [
          {
            "type": "table",
            "headers": [
              "Dim",
              "Quality",
              "RAM / 1M docs",
              "When to use"
            ],
            "rows": [
              [
                "128",
                "rough",
                "~0.5 GB",
                "Massive scale, recall not critical"
              ],
              [
                "384",
                "good",
                "~1.5 GB",
                "Default for sentence-transformers"
              ],
              [
                "768",
                "great",
                "~3 GB",
                "BERT-class, most RAG pipelines"
              ],
              [
                "1536",
                "excellent",
                "~6 GB",
                "OpenAI text-embedding-3-small"
              ],
              [
                "3072",
                "marginal gain",
                "~12 GB",
                "Only if eval proves it wins"
              ]
            ],
            "align": [
              "left",
              "left",
              "right",
              "left"
            ]
          },
          {
            "type": "p",
            "text": "More dimensions ≠ better. Past ~768 you hit **diminishing returns** while paying linearly more for storage, network, and every dot product. **Measure recall on your data** before paying for 3072-D."
          }
        ]
      },
      {
        "heading": "Build an index and search",
        "body": [
          {
            "type": "p",
            "text": "Two flavors: **brute-force numpy** (perfect recall, fine up to ~100k docs) and **FAISS** (approximate, scales to billions). Same API shape — embed, normalize, search, return top-k."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import numpy as np, faiss\nfrom sentence_transformers import SentenceTransformer\n\nmodel = SentenceTransformer(\"all-MiniLM-L6-v2\")  # 384-D, ~80MB, fast\ndocs = [\"red wine pairs with steak\",\n        \"white wine pairs with fish\",\n        \"the forklift broke again\"]\n\nX = model.encode(docs, normalize_embeddings=True)  # already unit vectors\nX = X.astype(\"float32\")  # FAISS requires float32\n\n# --- numpy brute force ---\nq = model.encode([\"what to drink with salmon\"], normalize_embeddings=True)\nscores = X @ q.T  # (N,384) · (384,1) → cosine\ntop = np.argsort(-scores.ravel())[:2]  # descending, take 2\n\n# --- FAISS, same idea, scales to millions ---\nindex = faiss.IndexFlatIP(384)  # IP = inner product = cosine when normalized\nindex.add(X)  # in-RAM, no training needed\nD, I = index.search(q.astype(\"float32\"), k=2)  # D=scores, I=row ids\n\nfor rank, idx in enumerate(I[0]):\n    print(rank, docs[idx], float(D[0][rank]))  # \"white wine pairs with fish\" wins"
          },
          {
            "type": "p",
            "text": "`IndexFlatIP` is exact and brutally simple. When you outgrow it, swap to `IndexIVFFlat` or `IndexHNSWFlat` — same `.search()` call, but **approximate** with a tunable recall/latency knob."
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
                "term": "Mixed models",
                "def": "Vectors from different embedding models live in different spaces — cosine between them is meaningless. Pick one model and re-embed everything when you change."
              },
              {
                "term": "Forgetting to normalize",
                "def": "If you use inner product but skip normalization, longer documents win by magnitude alone. Either L2-normalize or use a true cosine index."
              },
              {
                "term": "Stale embeddings",
                "def": "Re-embedding the whole corpus on a model bump is expensive. Version your index by model name so you never silently mix generations."
              },
              {
                "term": "Domain drift",
                "def": "General-purpose models are mediocre on legal, medical, or code. Evaluate on YOUR data before committing — sometimes a smaller fine-tuned model crushes a giant generic one."
              },
              {
                "term": "Curse of dimensionality",
                "def": "In very high-D, almost everything looks moderately similar. Always look at the score gap between top-1 and top-10 — not just the absolute number."
              }
            ]
          },
          {
            "type": "quote",
            "text": "An embedding is just a learned address. The whole game is making sure semantically similar things end up as neighbors."
          }
        ]
      }
    ]
  },
  "ai-finetuning": {
    "sections": [
      {
        "heading": "Three knobs, three failure modes",
        "body": [
          {
            "type": "p",
            "text": "You have a base LLM and a job to do. Your three real options are **prompting** (write better instructions), **RAG** (inject retrieved context at query time), and **fine-tuning** (update the weights). They are not competitors — they solve **different problems**, and most production systems use **all three**."
          },
          {
            "type": "p",
            "text": "Pick the wrong one and you will pay for it. Fine-tune when you needed RAG and your model hallucinates **stale facts**. Use RAG when you needed fine-tuning and the model still **refuses the format** you asked for. Prompt when you needed either and your latency is fine but your **accuracy is a coin flip**."
          }
        ]
      },
      {
        "heading": "What each one actually changes",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Prompting",
                "def": "Adjusts the input only — system message, few-shot examples, output schema. Zero training, zero infra, takes minutes."
              },
              {
                "term": "RAG",
                "def": "Retrieves relevant chunks from a vector store or DB and pastes them into the context window before generation. Model weights unchanged."
              },
              {
                "term": "Fine-tuning (SFT)",
                "def": "Supervised gradient updates on (prompt, completion) pairs. Teaches **behavior, tone, format** — not facts."
              },
              {
                "term": "LoRA / adapters",
                "def": "Cheap fine-tuning: freeze the base, train tiny rank-decomposed matrices. ~1% of params, swappable per tenant."
              },
              {
                "term": "RLHF / DPO",
                "def": "Aligns the model to preferences (which of two answers is better). Used after SFT for taste, refusal, safety."
              }
            ]
          }
        ]
      },
      {
        "heading": "The tradeoff table",
        "body": [
          {
            "type": "p",
            "text": "**First, what each costs you.** Setup cost is dev time before launch; per-query latency is what every user pays forever."
          },
          {
            "type": "table",
            "headers": [
              "Approach",
              "Setup cost",
              "Per-query latency"
            ],
            "align": [
              "left",
              "center",
              "center"
            ],
            "rows": [
              [
                "Prompting",
                "Minutes",
                "Lowest (1 call)"
              ],
              [
                "Few-shot prompting",
                "Hours",
                "Low (bigger ctx)"
              ],
              [
                "RAG",
                "Days (index + eval)",
                "Medium (retrieve + gen)"
              ],
              [
                "LoRA fine-tune",
                "Days (data + train)",
                "Low (1 call)"
              ],
              [
                "Full fine-tune",
                "Weeks ($$$)",
                "Low (1 call)"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Then, how strong the adaptation is and whether it stays fresh.** Freshness and adaptation strength trade against each other."
          },
          {
            "type": "table",
            "headers": [
              "Approach",
              "Freshness",
              "Adaptation strength"
            ],
            "align": [
              "left",
              "center",
              "center"
            ],
            "rows": [
              [
                "Prompting",
                "✓ live",
                "Weak"
              ],
              [
                "Few-shot prompting",
                "✓ live",
                "Medium"
              ],
              [
                "RAG",
                "✓ live",
                "Medium-strong on facts"
              ],
              [
                "LoRA fine-tune",
                "✗ frozen at train time",
                "Strong on behavior"
              ],
              [
                "Full fine-tune",
                "✗ frozen",
                "Strongest, riskiest"
              ]
            ]
          },
          {
            "type": "p",
            "text": "RAG wins on freshness because the **index** changes, not the weights. Fine-tuning wins on behavior because the weights **are** the change — but now retraining is the only way to update Tuesday's pricing."
          }
        ]
      },
      {
        "heading": "Decision flow",
        "body": [
          {
            "type": "diagram",
            "title": "Pick the cheapest thing that works",
            "nodes": [
              {
                "id": "q",
                "label": "New requirement",
                "subtitle": "what's failing?",
                "x": 0.5,
                "y": 0.05,
                "accent": "water"
              },
              {
                "id": "prompt",
                "label": "Prompt + few-shot",
                "subtitle": "format, simple tasks",
                "x": 0.15,
                "y": 0.3,
                "accent": "sky"
              },
              {
                "id": "rag",
                "label": "RAG",
                "subtitle": "stale or unseen facts",
                "x": 0.5,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "ft",
                "label": "LoRA fine-tune",
                "subtitle": "wrong behavior / tone",
                "x": 0.85,
                "y": 0.8,
                "accent": "fire"
              },
              {
                "id": "stack",
                "label": "Stack all three",
                "subtitle": "prod systems do this",
                "x": 0.5,
                "y": 0.92,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "q",
                "to": "prompt",
                "kind": "dashed",
                "label": "try first",
                "accent": "sky"
              },
              {
                "from": "q",
                "to": "rag",
                "kind": "dashed",
                "label": "facts wrong/missing",
                "accent": "earth"
              },
              {
                "from": "q",
                "to": "ft",
                "kind": "dashed",
                "label": "style/schema off",
                "accent": "fire"
              },
              {
                "from": "prompt",
                "to": "stack",
                "kind": "solid"
              },
              {
                "from": "rag",
                "to": "stack",
                "kind": "solid"
              },
              {
                "from": "ft",
                "to": "stack",
                "kind": "solid"
              }
            ]
          }
        ]
      },
      {
        "heading": "What it looks like in code",
        "body": [
          {
            "type": "p",
            "text": "A real support bot stacks all three. Fine-tune for **tone**, RAG for **product facts**, prompt for **per-request policy**."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic  # base SDK, model unchanged\nclient = Anthropic()\n\nquery = \"Why was my invoice $47 higher this month?\"\n\n# 1. RAG — pull live facts the model can't have memorized\nchunks = vector_db.search(query, k=4)  # top-k by cosine; ~200 tokens each\nctx = \"\\n---\\n\".join(c.text for c in chunks)  # joined with separator the model learned\n\n# 2. Prompt — per-request policy, cheap to change\nsystem = (\n    \"You are Acme Support. Cite invoice line IDs. \"  # behavioral guardrail\n    \"Refuse refunds over $500 — escalate instead.\"   # policy that may change weekly\n)\n\n# 3. Fine-tuned model handles tone/format we trained on\nresp = client.messages.create(\n    model=\"acme-support-lora-v7\",  # LoRA adapter on top of base\n    system=system,  # injected, not trained in\n    messages=[{\"role\": \"user\",\n               \"content\": f\"<docs>{ctx}</docs>\\n{query}\"}],  # RAG context inline\n    max_tokens=400,\n)"
          },
          {
            "type": "p",
            "text": "Update product docs? Re-embed, **no retrain**. Change refund policy? Edit the system prompt, **no retrain**. Want a calmer voice across every tenant? Now you retrain the LoRA."
          }
        ]
      },
      {
        "heading": "Pros and cons, honestly",
        "body": [
          {
            "type": "h3",
            "text": "RAG"
          },
          {
            "type": "pros-cons",
            "goodLabel": "Reach for it when",
            "watchLabel": "It bites you when",
            "good": [
              "Facts change daily (docs, prices, inventory, tickets)",
              "You need **citations** — auditors and users both want them",
              "Per-tenant data — each customer's index stays isolated",
              "Cheap iteration: re-embed, ship in minutes"
            ],
            "watch": [
              "Bad retrieval = confidently wrong answers — eval the retriever, not just the LLM",
              "Latency adds up: embed + ANN search + bigger context = +200-800ms",
              "Won't fix **format or behavior** — model still ignores your JSON schema"
            ]
          },
          {
            "type": "h3",
            "text": "Fine-tuning"
          },
          {
            "type": "pros-cons",
            "goodLabel": "Reach for it when",
            "watchLabel": "It bites you when",
            "good": [
              "You have **1k+ high-quality** examples of the exact behavior you want",
              "Output format is rigid (function calls, DSLs, regulated language)",
              "Shorter prompts at inference — token cost drops, latency drops",
              "LoRA adapters are cheap to train and **hot-swappable per tenant**"
            ],
            "watch": [
              "Frozen at training time — every fact update means a new training run",
              "Catastrophic forgetting: model gets worse at things you didn't include",
              "Eval is hard — you can't just diff outputs, you need a held-out set",
              "Fine-tuning over a moving base model means **redoing it every upgrade**"
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
              "**Fine-tuning to inject facts.** It works in demos, fails in prod. The model learns a *plausible* version of the fact and confidently corrupts it. Use RAG.",
              "**RAG to fix behavior.** Stuffing 'be polite' into retrieved context every time is a sign you needed SFT.",
              "**Skipping prompting first.** A two-line system message often closes 60% of the gap. Try it before you stand up a vector DB.",
              "**Ignoring the eval set.** Whichever approach you pick, you need a frozen set of ~100 graded examples — otherwise you cannot tell if your change helped or regressed."
            ]
          },
          {
            "type": "quote",
            "text": "Prompt for policy, retrieve for facts, fine-tune for behavior. Mix them up and you'll pay for it twice — once in dollars, once in trust."
          },
          {
            "type": "explain-back",
            "prompt": "You've now seen **prompting**, **RAG**, and **fine-tuning (LoRA)** as three different knobs. Design the adaptation strategy for a customer-support bot whose product docs change weekly, whose refund policy changes monthly, and whose tone must stay consistent across thousands of tickets. Say which knob owns each requirement, then name the one trade-off that would make you reconsider stacking all three.",
            "modelAnswer": "Split the requirements by what each knob actually changes. **Weekly-changing docs → RAG**: re-embed the index, weights untouched, answers stay fresh with citations. **Monthly-changing refund policy → prompting**: it's a rule that lives in the system message, so editing one string ships in seconds with no retrain. **Consistent tone across thousands of tickets → fine-tuning (LoRA)**: behavior/voice is what gradient updates teach, and a LoRA adapter is cheap and hot-swappable per tenant. Each knob owns the requirement that matches *its update mechanism*: index for facts, prompt for policy, weights for behavior — and stacking them keeps fast-moving things out of the slow-to-update weights. **The trade-off I'd watch is the base-model upgrade tax**: a LoRA is frozen against one base, so every time the foundation model is upgraded I must re-train and re-eval the adapter against a held-out set. If the team can't sustain that retraining cadence, I'd drop the fine-tune and push tone into a longer prompt instead — accepting weaker, costlier-per-call adaptation in exchange for zero retraining.",
            "hint": "Match each requirement to the knob whose *update mechanism* fits its change frequency: index re-embed (facts), edit a string (policy), gradient update (behavior). Then ask what breaks the frozen knob.",
            "commit": {
              "q": "The product docs change every week. Which knob should own keeping answers current?",
              "opts": [
                "Fine-tune a fresh LoRA on the new docs each week",
                "RAG — re-embed the doc index and retrieve at query time",
                "Paste the full docs into the system prompt on every call"
              ],
              "answer": 1,
              "why": "Fast-changing facts belong in the index, not the weights or the prompt — a re-embed ships fresh answers with no retrain and no giant per-call token bill. Now map the other two requirements the same way."
            }
          }
        ]
      }
    ]
  },
  "ai-evaluation": {
    "sections": [
      {
        "heading": "Accuracy is a liar",
        "body": [
          {
            "type": "p",
            "text": "Your fraud model hits **99.3% accuracy** on the test set. Ship it? No — 99.3% of transactions aren't fraud, so a model that predicts *never fraud* gets the same score. **Accuracy collapses on imbalanced data**, and almost every interesting problem is imbalanced."
          },
          {
            "type": "p",
            "text": "Evaluation is the part of ML where teams lie to themselves the hardest. You pick the metric that makes the dashboard green, then six weeks later production tells you the truth. Pick the metric *before* you train, tied to the **business cost of each error type**."
          }
        ]
      },
      {
        "heading": "Split before you touch the data",
        "body": [
          {
            "type": "p",
            "text": "**Train/val/test** — three disjoint sets, decided once, never crossed. Train fits weights. Val tunes hyperparameters and picks the model. Test is opened **exactly once**, at the end, to report a number you'll defend."
          },
          {
            "type": "p",
            "text": "Touching the test set during development is **data leakage** dressed in a lab coat. So is fitting your scaler on the full dataset before splitting — the mean of the test rows now leaks into training. Split first, fit transforms on train only, apply to val/test."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from sklearn.model_selection import train_test_split\n\nX_tr, X_tmp, y_tr, y_tmp = train_test_split(\n    X, y, test_size=0.30, stratify=y, random_state=42)   # stratify preserves class ratio\nX_val, X_te, y_val, y_te = train_test_split(\n    X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=42)  # 70/15/15 final split\n\nscaler = StandardScaler().fit(X_tr)   # fit ONLY on train — no leakage\nX_tr  = scaler.transform(X_tr)  # apply learned μ, σ\nX_val = scaler.transform(X_val)  # same μ, σ — never refit\nX_te  = scaler.transform(X_te)  # test stays sealed until the end"
          }
        ]
      },
      {
        "heading": "The confusion matrix is the source of truth",
        "body": [
          {
            "type": "p",
            "text": "Every binary classification metric is a ratio of four numbers — **TP, FP, TN, FN**. Build the matrix once, derive everything from it. Writing it from scratch removes the mystery."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def confusion_matrix(y_true, y_pred):\n    tp = fp = tn = fn = 0  # four counters, one pass\n    for yt, yp in zip(y_true, y_pred):  # assumes labels are 0/1\n        if yt == 1 and yp == 1:  tp += 1  # predicted fraud, was fraud\n        elif yt == 0 and yp == 1: fp += 1  # false alarm — angry customer\n        elif yt == 0 and yp == 0: tn += 1  # correctly ignored\n        elif yt == 1 and yp == 0: fn += 1  # missed fraud — money gone\n    return tp, fp, tn, fn\n\ntp, fp, tn, fn = confusion_matrix(y_te, y_hat)\n\nprecision = tp / (tp + fp)  # of flagged, how many were real\nrecall    = tp / (tp + fn)  # of real, how many we caught\nf1        = 2 * precision * recall / (precision + recall)  # harmonic mean — punishes imbalance\nacc       = (tp + tn) / (tp + fp + tn + fn)  # the liar, for reference"
          }
        ]
      },
      {
        "heading": "The metrics, side by side",
        "body": [
          {
            "type": "table",
            "headers": [
              "Metric",
              "Formula",
              "Use when",
              "Fails when"
            ],
            "rows": [
              [
                "**Accuracy**",
                "(TP+TN) / all",
                "classes ~balanced, costs symmetric",
                "imbalanced — 99% baseline is trivial"
              ],
              [
                "**Precision**",
                "TP / (TP+FP)",
                "false alarms are expensive (spam, fraud holds)",
                "ignores misses entirely"
              ],
              [
                "**Recall**",
                "TP / (TP+FN)",
                "missing positives is expensive (cancer, fraud)",
                "predict-all-1 scores 1.0"
              ],
              [
                "**F1**",
                "2·P·R / (P+R)",
                "you want one number balancing P and R",
                "treats P and R as equally important"
              ],
              [
                "**ROC-AUC**",
                "area under TPR vs FPR",
                "ranking quality, roughly balanced data",
                "**overstates skill on rare positives**"
              ],
              [
                "**PR-AUC**",
                "area under P vs R",
                "**imbalanced data**, rare positive class",
                "harder to compare across datasets"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**ROC-AUC vs PR-AUC** is the trap most teams fall into. ROC plots TPR against FPR — and FPR has a huge denominator (all the negatives) when negatives dominate. The curve looks gorgeous while you're still missing most positives. **PR-AUC** keeps the rare class in both axes; it tells the truth on a 1-in-1000 problem."
          }
        ]
      },
      {
        "heading": "Threshold and calibration",
        "body": [
          {
            "type": "p",
            "text": "Your classifier emits a **probability**, not a class. The threshold (default 0.5) is a business decision, not a math one. Sweep it, plot the PR curve, pick the operating point where precision and recall match your cost matrix."
          },
          {
            "type": "walkthrough",
            "title": "From score to decision",
            "why": "A raw probability becomes a yes/no only after you calibrate it and cross it against a business threshold.",
            "nodes": [
              {
                "id": "m",
                "label": "Model",
                "subtitle": "p ∈ [0,1]",
                "x": 0.3,
                "y": 0.3,
                "accent": "sky"
              },
              {
                "id": "c",
                "label": "Calibration",
                "subtitle": "Platt",
                "x": 0.7,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "t",
                "label": "Threshold τ",
                "subtitle": "business",
                "x": 0.3,
                "y": 0.75,
                "accent": "earth"
              },
              {
                "id": "d",
                "label": "Decision",
                "subtitle": "approve",
                "x": 0.7,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Model emits a score",
                "description": "The classifier hands you a **probability** `p ∈ [0,1]`, not a class. This number is the only thing the model actually produces.",
                "activeNodes": ["m"],
                "activeEdges": []
              },
              {
                "title": "Calibrate the score",
                "description": "Raw scores often lie — a `0.8` may not mean 80%. **Platt scaling** on a validation set bends the score so it matches real-world frequencies.",
                "activeNodes": ["m", "c"],
                "activeEdges": [{ "from": "m", "to": "c" }]
              },
              {
                "title": "Apply the threshold τ",
                "description": "Compare the calibrated score to a cutoff `τ`. This is a **business decision**, not a math one — set it where your cost matrix says it hurts least.",
                "activeNodes": ["c", "t"],
                "activeEdges": [{ "from": "c", "to": "t" }]
              },
              {
                "title": "Output the decision",
                "description": "Score above `τ` means **approve**, below means reject. Only now does a probability become an action.",
                "activeNodes": ["t", "d"],
                "activeEdges": [{ "from": "t", "to": "d" }]
              }
            ]
          },
          {
            "type": "p",
            "text": "**Calibration** asks a separate question: when the model says 0.8, does it actually happen 80% of the time? A random forest can rank perfectly (high AUC) while being wildly miscalibrated. Plot a **reliability diagram**; if it sags, apply **Platt scaling** or **isotonic regression** on the validation set."
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
                "term": "Leakage via preprocessing",
                "def": "fitting scalers, imputers, or feature selectors on the full dataset before splitting — the test set whispers into training."
              },
              {
                "term": "Temporal leakage",
                "def": "random splits on time-series data. Past must predict future; split by date, not by row."
              },
              {
                "term": "Test set burn-out",
                "def": "tuning against the test set turns it into a second validation set. Numbers stop meaning anything."
              },
              {
                "term": "Single-number reporting",
                "def": "one F1 hides everything. Report precision, recall, AUC, and the confusion matrix at your chosen threshold."
              },
              {
                "term": "Class-weighted accuracy theater",
                "def": "balancing the metric without balancing the loss. Fix the training objective, not just the scoreboard."
              }
            ]
          },
          {
            "type": "quote",
            "text": "If you can't draw the confusion matrix, you don't know what your model does — you know what your dashboard says."
          }
        ]
      }
    ]
  },
  "ai-distributed-training": {
    "sections": [
      {
        "heading": "Why this is a hard problem",
        "body": [
          {
            "type": "p",
            "text": "A 70-billion parameter model has weights that fill ~140GB in fp16. The gradients (same shape) add another 140GB. Adam optimizer state (two moments, fp32) adds another 560GB. Total: ~840GB of memory needed just for the parameters and their associated training state. An H100 has 80GB."
          },
          {
            "type": "p",
            "text": "The model doesn't fit on one GPU. Neither does its gradient. Neither does the activations during forward pass. You MUST split the work across many GPUs. The question is HOW, and the answer depends on what you\\'re trying to optimize."
          }
        ]
      },
      {
        "heading": "Data parallelism — the easy case",
        "body": [
          {
            "type": "p",
            "text": "Simplest pattern: replicate the entire model on every GPU. Split the batch across GPUs. Each GPU computes gradients on its slice. All-reduce gradients across GPUs. Update weights identically everywhere."
          },
          {
            "type": "p",
            "text": "This is fine until the model doesn't fit on one GPU. For a 7B model, data parallelism is the right choice — fast, easy to reason about, no complex sharding. For 70B+, the model alone can\\'t replicate fully and you need more sophisticated approaches."
          },
          {
            "type": "p",
            "text": "The key communication primitive is **all-reduce**: every GPU contributes its gradient, every GPU receives the average. Modern implementations (NCCL ring all-reduce) achieve near-linear scaling up to ~256 GPUs."
          }
        ]
      },
      {
        "heading": "Model parallelism — when the model doesn\\'t fit",
        "body": [
          {
            "type": "p",
            "text": "If the model is too big for one GPU, split the model itself. Two main flavors:"
          },
          {
            "type": "p",
            "text": "**Tensor parallelism (intra-layer):** Split individual matrix multiplications across GPUs. For a 4096×4096 layer on 4 GPUs, each GPU holds a 4096×1024 slice and computes its portion of the matmul. Outputs are gathered with all-reduce. Megatron-LM pioneered this; it requires high-bandwidth interconnect (NVLink) because of constant communication."
          },
          {
            "type": "p",
            "text": "**Pipeline parallelism (inter-layer):** Split layers across GPUs. GPU 0 has layers 1-12, GPU 1 has layers 13-24, etc. The forward pass flows through the pipeline. The challenge: while GPU 1 works on layer 13, what does GPU 0 do? Pipeline parallelism uses micro-batches to keep all stages busy — like a CPU pipeline, but with neural net layers."
          },
          {
            "type": "p",
            "text": "In practice, large-model training uses ALL three: data parallel × tensor parallel × pipeline parallel = \"3D parallelism.\" A typical 70B training job: 8-way tensor parallel × 8-way pipeline parallel × 16-way data parallel = 1024 GPUs."
          }
        ]
      },
      {
        "heading": "ZeRO — eliminating redundancy",
        "body": [
          {
            "type": "p",
            "text": "In vanilla data parallelism, every GPU stores the FULL model parameters + gradients + optimizer state. With 32 GPUs, you have 32 copies. Wasteful."
          },
          {
            "type": "p",
            "text": "ZeRO (Zero Redundancy Optimizer, DeepSpeed) shards these instead of replicating. Three stages:"
          },
          {
            "type": "ul",
            "items": [
              "**ZeRO-1:** Shard optimizer state (the biggest memory consumer). 4x reduction.",
              "**ZeRO-2:** Also shard gradients. 8x reduction.",
              "**ZeRO-3:** Also shard parameters. Each GPU only holds a slice; gathers needed slices during forward/backward pass. ~N-x reduction with N GPUs."
            ]
          },
          {
            "type": "p",
            "text": "ZeRO-3 essentially gives you model parallelism with simpler implementation. Drawback: more communication. Use ZeRO-3 when memory is your bottleneck and you have fast interconnect."
          },
          {
            "type": "p",
            "text": "FSDP (Fully Sharded Data Parallel) in PyTorch is the modern equivalent — ZeRO-3 ideas integrated into the framework itself."
          }
        ]
      },
      {
        "heading": "What goes wrong in practice",
        "body": [
          {
            "type": "h3",
            "text": "Stragglers"
          },
          {
            "type": "p",
            "text": "Bulk synchronous training means every GPU must finish its step before all-reduce. One slow GPU (thermal throttle, NCCL slow, network hiccup) blocks all others. Aggressive monitoring of per-step times and outlier detection is essential."
          },
          {
            "type": "h3",
            "text": "Loss spikes"
          },
          {
            "type": "p",
            "text": "Large models periodically experience loss spikes — sudden 10x jumps in training loss. Causes: outlier batch with all very-rare tokens, numerical overflow in attention, learning rate too aggressive. Standard mitigations: gradient clipping, learning rate warmup, skipping batches with anomalous gradients."
          },
          {
            "type": "h3",
            "text": "Checkpointing"
          },
          {
            "type": "p",
            "text": "Training a 70B model takes weeks. Hardware fails. Checkpoint every N steps to durable storage. Test that you can actually resume from checkpoint — a checkpoint you've never restored is theoretically a backup; practically it might not be."
          },
          {
            "type": "h3",
            "text": "Determinism"
          },
          {
            "type": "p",
            "text": "Distributed training is hard to make bit-exactly reproducible. All-reduce ordering varies. Some kernels are non-deterministic. Plan for \"approximately reproducible\" — same global behavior, not exact same loss curve."
          }
        ]
      }
    ]
  },
  "lab-numpy-mlp": {
    "sections": [
      {
        "heading": "Why hand-roll a network when PyTorch exists",
        "body": [
          {
            "type": "p",
            "text": "Every time you call `loss.backward()`, PyTorch walks a graph of partial derivatives you didn't write. That's fine — until your loss goes NaN, your gradients explode, or your model refuses to learn. Then you're debugging a black box you never opened."
          },
          {
            "type": "p",
            "text": "This lab cracks it open. You'll build a **2-layer MLP in raw NumPy**, derive the gradients on paper first, then translate the math line-by-line into code. Target: **95%+ test accuracy on MNIST** in ~6-10 hours, math included. The goal isn't SOTA — it's to make **backprop stop feeling like magic** so you can debug non-trivial PyTorch models later."
          },
          {
            "type": "quote",
            "text": "If you can't derive ∂L/∂W on paper, you can't debug a model that won't train.",
            "cite": "the lesson in one sentence"
          }
        ]
      },
      {
        "heading": "The architecture you're building",
        "body": [
          {
            "type": "p",
            "text": "Two linear layers, one ReLU, softmax + cross-entropy at the end. That's it. **784 → 128 → 10**, roughly 100k parameters — small enough to debug, large enough to hit 95%."
          },
          {
            "type": "walkthrough",
            "title": "Forward pass, MNIST → digit prediction",
            "why": "One image flows left to right through two linear layers and a softmax to become 10 probabilities — no loops, no magic.",
            "height": 220,
            "nodes": [
              {
                "id": "x",
                "label": "x",
                "subtitle": "784 pixels",
                "x": 0.05,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "l1",
                "label": "W₁·x + b₁",
                "subtitle": "→ 128",
                "x": 0.28,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "relu",
                "label": "ReLU",
                "subtitle": "max(0,·)",
                "x": 0.5,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "l2",
                "label": "W₂·h + b₂",
                "subtitle": "→ 10",
                "x": 0.72,
                "y": 0.85,
                "accent": "sky"
              },
              {
                "id": "sm",
                "label": "softmax",
                "subtitle": "probs",
                "x": 0.93,
                "y": 0.85,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Flatten the image",
                "description": "A 28×28 digit arrives as **784 pixels** in one long vector `x`. That's the raw input — no features engineered, just brightness values.",
                "activeNodes": ["x"],
                "activeEdges": []
              },
              {
                "title": "First linear layer",
                "description": "Multiply by `W₁` and add `b₁` to squeeze 784 numbers down to **128**. Each output mixes every pixel — the layer is learning useful combinations.",
                "activeNodes": ["x", "l1"],
                "activeEdges": [{ "from": "x", "to": "l1" }]
              },
              {
                "title": "ReLU nonlinearity",
                "description": "`max(0, ·)` zeroes out negatives. Without this kink the two linear layers would collapse into one — ReLU is what makes the net **deep**.",
                "activeNodes": ["l1", "relu"],
                "activeEdges": [{ "from": "l1", "to": "relu" }]
              },
              {
                "title": "Second linear layer",
                "description": "`W₂·h + b₂` maps the 128 hidden units to **10 logits** — one raw score per digit class, not yet probabilities.",
                "activeNodes": ["relu", "l2"],
                "activeEdges": [{ "from": "relu", "to": "l2" }]
              },
              {
                "title": "Softmax to probabilities",
                "description": "Exponentiate and normalize so the 10 scores **sum to 1**. The biggest one is the model's predicted digit.",
                "activeNodes": ["l2", "sm"],
                "activeEdges": [{ "from": "l2", "to": "sm" }]
              }
            ]
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Xavier init",
                "def": "Scale W by √(1/fan_in) so activations don't explode or vanish at layer 1."
              },
              {
                "term": "ReLU",
                "def": "max(0, z) — gradient is 1 where z>0, else 0. Dead-simple to differentiate."
              },
              {
                "term": "Softmax",
                "def": "Exponentiate and normalize — turns 10 logits into a probability distribution."
              },
              {
                "term": "Cross-entropy",
                "def": "-log(prob of true class) — punishes confident wrong answers harder than uncertain ones."
              }
            ]
          }
        ]
      },
      {
        "heading": "Forward pass — write it before you differentiate it",
        "body": [
          {
            "type": "p",
            "text": "Pixels arrive as `uint8` in [0, 255]. Normalize to [0, 1], one-hot the labels, batch by 64. Then run the math."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "X = X.astype(np.float32) / 255.0  # pixels → [0,1], float for matmul\nY = np.eye(10)[y]  # one-hot: shape (N, 10)\n\nW1 = np.random.randn(784, 128) * np.sqrt(1/784)   # Xavier — keeps variance stable\nb1 = np.zeros(128)  # biases start at zero, fine\nW2 = np.random.randn(128, 10)  * np.sqrt(1/128)\nb2 = np.zeros(10)\n\n# forward, batch shape (B, 784)\nz1 = x @ W1 + b1  # pre-activation, shape (B, 128)\nh  = np.maximum(0, z1)  # ReLU — zeros out negatives\nz2 = h @ W2 + b2  # logits, shape (B, 10)\nz2 -= z2.max(axis=1, keepdims=True)  # subtract max — softmax stability\nprobs = np.exp(z2)  # now safe, no overflow\nprobs /= probs.sum(axis=1, keepdims=True)  # normalize per row\n\nloss = -np.log(probs[range(B), y] + 1e-9).mean()  # ε guards log(0)"
          },
          {
            "type": "p",
            "text": "The **max-subtraction trick** on line 13 is non-negotiable. Without it, `exp(logit)` overflows to `inf` the moment any logit exceeds ~88, and your loss becomes NaN on epoch 1. Subtracting the row max leaves softmax mathematically identical but numerically sane."
          }
        ]
      },
      {
        "heading": "Backward — the part you derive on paper first",
        "body": [
          {
            "type": "p",
            "text": "**Do the math on paper before you write any backward code.** The miracle of softmax + cross-entropy is that the gradient at the output collapses to one beautiful line: `dz2 = probs - Y`. The exp, the log, the sum-normalize — they all cancel. Derive it once and you'll never forget it."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "dz2 = (probs - Y) / B  # output gradient — softmax+CE magic\ndW2 = h.T @ dz2  # (128,B) @ (B,10) → (128,10) ✓\ndb2 = dz2.sum(axis=0)  # bias grad = sum over batch\n\ndh  = dz2 @ W2.T  # backprop through W2\ndz1 = dh * (z1 > 0)  # ReLU derivative — gate by sign of z1\ndW1 = x.T @ dz1  # (784,B) @ (B,128) → (784,128) ✓\ndb1 = dz1.sum(axis=0)\n\n# SGD step\nfor p, g in [(W1,dW1),(b1,db1),(W2,dW2),(b2,db2)]:\n    p -= η * g  # in-place — no new arrays per step"
          },
          {
            "type": "p",
            "text": "**Shape-check obsessively.** 90% of backprop bugs are a transpose in the wrong place. Write the expected `(rows, cols)` next to every line as a comment — when an assert fires, you'll know within seconds which line lied."
          }
        ]
      },
      {
        "heading": "Training loop and the 95% finish line",
        "body": [
          {
            "type": "p",
            "text": "10 epochs, batch size 64, learning rate η ≈ 0.1, plain SGD. No momentum, no Adam, no schedulers. With Xavier init and a clean backward pass, MNIST falls over."
          },
          {
            "type": "table",
            "headers": [
              "Symptom",
              "Likely cause",
              "Fix"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Loss = NaN epoch 1",
                "softmax overflow",
                "Subtract row max before `exp`"
              ],
              [
                "Loss flat at 2.30",
                "log(10) ≈ 2.30 — random guessing",
                "Check Xavier scale; check label one-hot"
              ],
              [
                "Train 99%, test 85%",
                "Overfit (small data)",
                "Expected for vanilla MLP — that's fine"
              ],
              [
                "Accuracy stuck at ~10%",
                "Sign error in `dz2`",
                "Re-derive on paper, check `(probs - Y)` not `(Y - probs)`"
              ],
              [
                "Loss decreases then explodes",
                "η too high",
                "Drop to 0.05, or clip grads"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "What you've earned",
            "watchLabel": "What's still not free",
            "good": [
              "You can derive ∂L/∂W for any layer you understand",
              "NaN losses are debuggable, not mysterious",
              "`loss.backward()` in PyTorch is now a known mechanism, not a spell",
              "Shape errors become a 30-second fix"
            ],
            "watch": [
              "This MLP plateaus around 97% — CNNs exist for a reason",
              "Plain SGD is slow; Adam earns its keep on bigger models",
              "Numerical stability gets harder with deeper nets — log-softmax, gradient clipping",
              "Real autograd handles arbitrary graphs; yours handles one architecture"
            ]
          },
          {
            "type": "p",
            "text": "**The point was never the 95%.** It was the moment you traced a gradient from output to input by hand and saw that backprop is just the chain rule, applied carefully, in reverse. Every PyTorch model you debug from here on out is the same machinery — just with more layers and someone else's autograd."
          }
        ]
      }
    ]
  },
  "lab-rag-pipeline": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Build a **production-shaped RAG pipeline** end to end: split documents into chunks, embed them, store the vectors, retrieve the top-k for a query, re-rank, then hand the survivors to an LLM with a strict prompt. The whole thing runs locally via `docker compose` — Postgres+pgvector as the store, a small embedder, your LLM of choice. **The goal isn't a demo; it's the architecture every RAG product converges to** once \"just throw it at GPT\" stops being good enough."
          },
          {
            "type": "p",
            "text": "You'll also wire an **eval harness** — a tiny labeled set with `answer / no-answer` ground truth — and track `recall@k`, `mrr`, and answer faithfulness on every change. Without eval, RAG is vibes. With eval, it's engineering."
          },
          {
            "type": "walkthrough",
            "title": "RAG pipeline",
            "why": "A question fetches its own evidence first, then the LLM answers from that evidence — and an eval harness keeps the whole loop honest.",
            "height": 220,
            "nodes": [
              {
                "id": "user",
                "label": "Query",
                "subtitle": "user question",
                "accent": "water",
                "x": 0.06,
                "y": 0.5
              },
              {
                "id": "app",
                "label": "Orchestrator",
                "subtitle": "embed+rerank",
                "accent": "sky",
                "x": 0.36,
                "y": 0.5
              },
              {
                "id": "vstore",
                "label": "Vector store",
                "subtitle": "pgvector · top-k",
                "accent": "earth",
                "x": 0.66,
                "y": 0.22
              },
              {
                "id": "llm",
                "label": "LLM",
                "subtitle": "answer + cites",
                "accent": "fire",
                "x": 0.66,
                "y": 0.78
              },
              {
                "id": "eval",
                "label": "Eval",
                "subtitle": "recall@k · mrr",
                "accent": "amber",
                "x": 0.94,
                "y": 0.5
              }
            ],
            "steps": [
              {
                "title": "User asks a question",
                "description": "Everything starts with a **query** — a plain-language question the model has no memorized answer to. This is the only user input.",
                "activeNodes": ["user"],
                "activeEdges": []
              },
              {
                "title": "Orchestrator takes over",
                "description": "The **orchestrator** embeds the question into a vector and gets ready to fetch evidence. It owns the whole request — embed, retrieve, rerank, prompt.",
                "activeNodes": ["user", "app"],
                "activeEdges": [{ "from": "user", "to": "app", "label": "question" }]
              },
              {
                "title": "Retrieve top-k chunks",
                "description": "The query vector hits the **vector store** (pgvector), which returns the **top-k** most similar chunks by cosine distance. This is the 'retrieval' in RAG.",
                "activeNodes": ["app", "vstore"],
                "activeEdges": [{ "from": "app", "to": "vstore", "label": "top-k" }]
              },
              {
                "title": "Generate the answer",
                "description": "The orchestrator pastes those chunks into the prompt and calls the **LLM**, which writes an answer **with citations** grounded in the retrieved text.",
                "activeNodes": ["app", "llm"],
                "activeEdges": [{ "from": "app", "to": "llm", "label": "prompt + ctx" }]
              },
              {
                "title": "Score every run",
                "description": "Each answer feeds an **eval harness** tracking `recall@k` and `mrr`. Without this scoreboard, RAG is vibes; with it, it's engineering.",
                "activeNodes": ["llm", "eval"],
                "activeEdges": [{ "from": "llm", "to": "eval", "label": "score" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "p",
            "text": "A reproducible pipeline anyone can run locally. One `compose up`, one `ingest.py`, one `ask.py`, one `eval.py`. Swap any layer without touching the others."
          },
          {
            "type": "ul",
            "items": [
              "**Chunker** — splits docs by recursive headings → paragraphs, target 400 tokens with 50-token overlap; preserves source spans.",
              "**Embedder** — calls a local or hosted model (`bge-small-en-v1.5` is the strong default) and writes 384-d vectors.",
              "**Vector store** — Postgres + `pgvector` with an `ivfflat` or `hnsw` index, cosine distance, metadata-filterable.",
              "**Retriever + re-ranker** — pulls top-50 by ANN, then re-ranks with a cross-encoder (`bge-reranker-base`) down to top-5.",
              "**Generator** — strict prompt with `cite-or-refuse` rule; returns `{answer, citations[]}` JSON.",
              "**Eval harness** — 30-question labeled set; reports `recall@k`, `mrr`, and faithfulness on every run."
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
              "Python 3.11+, Docker 24+ with `docker compose` v2.",
              "Postgres 16 image with the `pgvector` extension (`pgvector/pgvector:pg16`).",
              "~2 GB RAM for the embedder; CPU is fine for `bge-small`. GPU only if you swap to a 1B-param embedder.",
              "An LLM endpoint — OpenAI/Anthropic API key, or a local `vllm` / `ollama` serving a 7-8B chat model.",
              "Roughly 200 MB of disk per million chunks indexed with `hnsw`."
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
              "**Stand up the store** — `docker compose up db` with `pgvector`; run a migration that creates `chunks(id, doc_id, span, text, embedding vector(384))` and an `hnsw` index on `embedding vector_cosine_ops`.",
              "**Chunk the corpus** — recursive splitter on headings → paragraphs → sentences; keep `(doc_id, char_start, char_end)` so citations are real, not hallucinated.",
              "**Embed and ingest** — batch 64 chunks per embedder call; `COPY` into Postgres for 10× faster loads than per-row `INSERT`.",
              "**Wire the retriever** — top-50 by cosine ANN, then a cross-encoder re-ranker pass to top-5; this two-stage shape is what every serious RAG ships.",
              "**Write the generator prompt** — strict `cite-or-refuse`: every claim cites a `chunk_id`, or the answer is \"I don't know.\" Return JSON, not prose.",
              "**Build the eval set** — 30 hand-labeled `(question, gold_doc_ids, expected_answer | null)` pairs; include 5 unanswerable ones.",
              "**Wire `eval.py`** — compute `recall@k`, `mrr`, and faithfulness (does every cited span actually contain the claim?). Print a one-line summary.",
              "**Iterate on one knob at a time** — chunk size, k, re-ranker on/off — and watch the eval move. **That's the whole job.**"
            ]
          }
        ]
      },
      {
        "heading": "The retrieve-rerank-generate core",
        "body": [
          {
            "type": "p",
            "text": "The heart of the pipeline is ~40 lines. Everything else is plumbing around this:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def answer(q: str, k_ann: int = 50, k_final: int = 5) -> dict:\n    q_vec = embedder.encode([q], normalize=True)[0]  # L2-normalize → cosine = dot\n    rows = db.fetch(  # ANN over hnsw index\n        \"SELECT id, doc_id, text, embedding <=> %s AS dist \"\n        \"FROM chunks ORDER BY embedding <=> %s LIMIT %s\",\n        (q_vec, q_vec, k_ann),  # <=> is pgvector cosine distance\n    )\n    pairs = [(q, r[\"text\"]) for r in rows]  # cross-encoder eats (query, doc)\n    scores = reranker.predict(pairs)  # heavier model, but only on 50\n    top = sorted(zip(scores, rows), reverse=True)[:k_final]  # keep best 5 after rerank\n\n    ctx = \"\\n\\n\".join(  # build cite-able context block\n        f\"[{r['id']}] {r['text']}\" for _, r in top  # chunk_id is the citation key\n    )\n    prompt = PROMPT.format(question=q, context=ctx)  # strict cite-or-refuse template\n    raw = llm.generate(prompt, max_tokens=400, temp=0)   # temp=0 → reproducible eval runs\n\n    out = json.loads(raw)  # will raise if model broke schema\n    assert all(c in {r['id'] for _, r in top}  # citations must be from retrieved set\n               for c in out[\"citations\"]), \"hallucinated cite\"\n    return out  # {answer: str, citations: [int]}\n"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "**One command up:** `docker compose up` brings the store online; `python ingest.py corpus/` populates it; `python ask.py \"...\"` answers.",
              "**Recall@5 ≥ 0.85** on your 30-question eval set — the retriever finds the right chunk most of the time.",
              "**Re-ranker earns its keep:** turning it off drops `mrr` by ≥ 0.1 on the same set, and you can show the diff.",
              "**Refusal works:** all 5 unanswerable questions return `\"I don't know.\"` with empty citations — no hallucinated cites.",
              "**Reproducible:** `temp=0` + fixed seed means two `eval.py` runs print identical numbers.",
              "**Ingestion scales:** 10k chunks ingested in under 60s on a laptop (because you used `COPY`, not row-by-row)."
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
              "Every layer is swappable — embedder, store, LLM are all behind one-function interfaces",
              "Eval set turns \"feels better\" into a number you can git-blame",
              "`pgvector` means your RAG state is just SQL — backup, replicate, JOIN like any table"
            ],
            "watch": [
              "Chunking too small (≤128 tokens) destroys context; too large (≥1k) drowns the re-ranker. 400 ± overlap is the sweet spot",
              "Cosine on un-normalized vectors silently returns garbage — normalize at embed time, not query time",
              "`ivfflat` needs `ANALYZE` after a big ingest or recall craters; `hnsw` doesn't, and is usually the better default in 2026"
            ]
          }
        ]
      }
    ]
  },
  "lab-lora-finetune": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You take a frozen 7B base model — Llama-3, Mistral, or Qwen — and teach it a new style with **a few million trainable parameters instead of seven billion**. LoRA injects two low-rank matrices `A` and `B` into each attention projection so the effective weight update is `ΔW = B·A` with rank `r` typically 8 or 16. The base weights never move; you save a 30 MB adapter, not a 14 GB checkpoint."
          },
          {
            "type": "p",
            "text": "This is how every team ships a custom assistant in 2026 without a GPU farm. **One consumer-grade 24 GB GPU, one afternoon, one dataset of a few thousand examples** — and you have a model that follows your house style. The eval-before / eval-after pair is the load-bearing part; without it you cannot tell whether you actually learned anything or just overfit on a training quirk."
          },
          {
            "type": "walkthrough",
            "title": "The training loop",
            "why": "A frozen base plus a tiny trainable adapter is the whole trick — and the before/after eval is what proves you actually learned something.",
            "height": 220,
            "nodes": [
              {
                "id": "data",
                "label": "Dataset",
                "subtitle": "instr+resp",
                "accent": "water",
                "x": 0.08,
                "y": 0.5
              },
              {
                "id": "base",
                "label": "Base 7B",
                "subtitle": "4-bit",
                "accent": "amber",
                "x": 0.36,
                "y": 0.5
              },
              {
                "id": "lora",
                "label": "LoRA adapter",
                "subtitle": "~10M",
                "accent": "sky",
                "x": 0.62,
                "y": 0.5
              },
              {
                "id": "eval",
                "label": "Eval harness",
                "subtitle": "held-out · before/after",
                "accent": "earth",
                "x": 0.88,
                "y": 0.25
              },
              {
                "id": "ckpt",
                "label": "Adapter file",
                "subtitle": "adapter_model.safetensors",
                "accent": "fire",
                "x": 0.88,
                "y": 0.75
              }
            ],
            "steps": [
              {
                "title": "Start with the dataset",
                "description": "A few thousand **instruction + response** pairs in your house style. This is the only thing that teaches the model what 'good' looks like.",
                "activeNodes": ["data"],
                "activeEdges": []
              },
              {
                "title": "Feed tokens to the frozen base",
                "description": "Tokenized examples stream into a **4-bit base 7B** model. Its weights stay frozen — quantizing them is what lets a 7B fit on one consumer GPU.",
                "activeNodes": ["data", "base"],
                "activeEdges": [{ "from": "data", "to": "base", "label": "tokens" }]
              },
              {
                "title": "Train only the LoRA adapter",
                "description": "Gradients update a tiny **~10M-param adapter** (`ΔW = B·A`), not the base. That's ~1% of the weights — cheap to train, swappable per tenant.",
                "activeNodes": ["base", "lora"],
                "activeEdges": [{ "from": "base", "to": "lora", "label": "ΔW = B·A" }]
              },
              {
                "title": "Eval before vs after",
                "description": "Run held-out prompts through base **and** tuned model. This before/after compare is load-bearing — without it you can't tell learning from overfitting.",
                "activeNodes": ["lora", "eval"],
                "activeEdges": [{ "from": "lora", "to": "eval", "label": "compare" }]
              },
              {
                "title": "Save the adapter",
                "description": "Ship just the adapter — a ~30 MB `adapter_model.safetensors` that loads on top of the frozen base in one line. The base never changed.",
                "activeNodes": ["lora", "ckpt"],
                "activeEdges": [{ "from": "lora", "to": "ckpt", "label": "save" }]
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
              "**A reproducible training script** using `transformers` + `peft` + `bitsandbytes` that runs end-to-end on a single 24 GB GPU.",
              "**A 4-bit quantized base model** (QLoRA-style) so the 7B weights fit alongside activations and gradients with headroom.",
              "**A LoRA config** targeting attention projections (`q_proj`, `v_proj` minimum) with `r=16`, `α=32`, dropout `0.05`.",
              "**An instruction dataset** of 1k-5k chat-formatted examples — your own domain, or a public set like `databricks-dolly-15k`.",
              "**A before/after eval** running ~50 held-out prompts through both base and tuned model with side-by-side outputs.",
              "**A saved adapter** (`adapter_model.safetensors`, ~30 MB) that loads on top of the frozen base in one line."
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
              "**A single GPU with ≥ 16 GB VRAM** (24 GB strongly recommended — RTX 3090/4090, A5000, L4, or Colab A100).",
              "**Python 3.11+** with `torch>=2.3`, `transformers>=4.45`, `peft>=0.12`, `bitsandbytes>=0.43`, `accelerate`, `datasets`, `trl`.",
              "**CUDA 12.1+ drivers** (`nvidia-smi` should show your card; mismatched CUDA is the #1 first-hour bug).",
              "**Hugging Face token** with access to your chosen base (`meta-llama/Meta-Llama-3-8B-Instruct` is gated — request first).",
              "**~30 GB free disk** for the base weights, tokenizer, dataset cache, and adapter checkpoints.",
              "**A held-out eval set** of 30-100 prompts written before you train — judging post-hoc is how you fool yourself."
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
              "**Baseline first.** Load the base model, run your 50 eval prompts, save outputs to `eval_before.jsonl`. You cannot claim improvement without this file.",
              "**Format your dataset** into the chat template the base uses (`tokenizer.apply_chat_template`). Wrong template = the model learns to imitate noise.",
              "**Load in 4-bit** with `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_compute_dtype=torch.bfloat16)` — this is QLoRA.",
              "**Attach LoRA adapters** via `get_peft_model(model, LoraConfig(r=16, lora_alpha=32, target_modules=['q_proj','v_proj'], ...))` and confirm trainable params are < 1% of total.",
              "**Train with `SFTTrainer`** for 1-3 epochs, batch size 4 with gradient accumulation 4 (effective 16), `lr=2e-4`, cosine schedule, `bf16=True`.",
              "**Watch the loss curve** — should drop from ~2.0 to ~1.2; if it plateaus immediately, your data is mis-formatted or `lr` is too low.",
              "**Save the adapter** with `model.save_pretrained('./adapter')` — note that this writes only the adapter, not the 14 GB base.",
              "**Eval after.** Load `base + adapter`, run the same 50 prompts, save `eval_after.jsonl`, diff against `eval_before.jsonl`."
            ]
          }
        ]
      },
      {
        "heading": "The training script",
        "body": [
          {
            "type": "p",
            "text": "The heart of the lab. Every non-obvious line is annotated. Note the **four levers** you tune most often: `r`, `target_modules`, `lr`, `gradient_accumulation_steps`."
          },
          {
            "type": "p",
            "text": "**Load the base in 4-bit** so a 7B model fits in ~5 GB VRAM. `prepare_model_for_kbit_training` casts norms to fp32 and enables gradient checkpointing."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import torch\nfrom transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig\nfrom peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training\nfrom datasets import load_dataset\nfrom trl import SFTTrainer, SFTConfig\n\nBASE = \"mistralai/Mistral-7B-Instruct-v0.3\"   # any 7B chat base works\n\nbnb = BitsAndBytesConfig(\n    load_in_4bit=True,  # 7B fits in ~5 GB VRAM\n    bnb_4bit_quant_type=\"nf4\",  # NF4 > FP4 for accuracy\n    bnb_4bit_compute_dtype=torch.bfloat16,  # matmuls in bf16, weights stay 4-bit\n    bnb_4bit_use_double_quant=True,  # quantize the quant constants too\n)\n\ntok = AutoTokenizer.from_pretrained(BASE)\ntok.pad_token = tok.eos_token  # base has no pad; reuse EOS\n\nmodel = AutoModelForCausalLM.from_pretrained(\n    BASE, quantization_config=bnb, device_map=\"auto\",\n)\nmodel = prepare_model_for_kbit_training(model)"
          },
          {
            "type": "p",
            "text": "**Attach the LoRA adapter** — `r` is capacity, `target_modules` is where to inject. Attention projections cover most style/format shifts."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "lora = LoraConfig(\n    r=16,  # rank — capacity knob; 8/16/32 typical\n    lora_alpha=32,  # scaling: effective lr ∝ α/r\n    target_modules=[\"q_proj\", \"v_proj\",  # attention is where style lives\n                    \"k_proj\", \"o_proj\"],  # add k,o for harder shifts\n    lora_dropout=0.05,  # regularize tiny adapters too\n    bias=\"none\",  # don't train biases — almost never helps\n    task_type=\"CAUSAL_LM\",\n)\nmodel = get_peft_model(model, lora)\nmodel.print_trainable_parameters()  # expect ~0.3% of 7B trainable"
          },
          {
            "type": "p",
            "text": "**Load and format the dataset** through the base model's chat template so prompts look exactly like the ones it was trained on."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "ds = load_dataset(\"json\", data_files=\"train.jsonl\", split=\"train\")\n\ndef format_row(r):  # render via chat template\n    msgs = [{\"role\": \"user\",      \"content\": r[\"instruction\"]},\n            {\"role\": \"assistant\", \"content\": r[\"response\"]}]\n    return {\"text\": tok.apply_chat_template(msgs, tokenize=False)}\n\nds = ds.map(format_row, remove_columns=ds.column_names)"
          },
          {
            "type": "p",
            "text": "**Train and save.** Only the adapter weights get serialized — ~30 MB instead of the 14 GB base."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "cfg = SFTConfig(\n    output_dir=\"./adapter\",\n    per_device_train_batch_size=4,  # 4 × seq_len 1024 fits in 24 GB\n    gradient_accumulation_steps=4,  # effective batch 16\n    num_train_epochs=2,  # 1-3 is the right range\n    learning_rate=2e-4,  # LoRA tolerates higher lr than full FT\n    lr_scheduler_type=\"cosine\",  # warmup then decay — stable\n    warmup_ratio=0.03,  # short warmup; long ones waste budget\n    bf16=True,  # bf16 wins on Ampere+; fp16 overflows\n    logging_steps=10,  # watch loss live, catch divergence early\n    save_strategy=\"epoch\",  # one checkpoint per epoch is plenty\n    max_seq_length=1024,  # truncate long rows; quadratic in attn\n    packing=False,  # disable until you've verified shapes\n)\n\nSFTTrainer(model=model, args=cfg, train_dataset=ds,\n           dataset_text_field=\"text\").train()\n\nmodel.save_pretrained(\"./adapter\")  # writes ~30 MB, not 14 GB\n"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Trainable params < 1%:** `print_trainable_parameters()` reports something like `10,485,760 || 7,251,517,440 || 0.144%`.",
              "**Loss actually drops:** training loss falls at least 30% from step 0 to end of epoch 1, and eval loss tracks it (gap stays small).",
              "**VRAM stays under your budget:** `nvidia-smi` peak < 22 GB on a 24 GB card — no OOM mid-epoch.",
              "**Adapter is portable:** the saved `./adapter` directory is ~30 MB and reloads on top of the base in one line: `PeftModel.from_pretrained(base, './adapter')`.",
              "**Before/after diff is visible:** at least 30 of 50 held-out prompts produce a different (and you-judge-better) response than the base.",
              "**Base is untouched:** loading the base alone — without the adapter — gives identical outputs to your `eval_before.jsonl`."
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
              "30 MB adapter vs 14 GB checkpoint — ship one base, swap adapters per customer",
              "Trains on a single consumer GPU in 1-3 hours, not days on a cluster",
              "Base model stays bit-identical, so rollback is just `not loading the adapter`"
            ],
            "watch": [
              "Wrong chat template silently trains the model to imitate broken formatting",
              "Targeting only `q_proj` is fine for style; for new tasks add `k,v,o` and the MLP projections",
              "`α/r` is the real learning-rate multiplier — doubling `r` without halving `α` changes the effective lr"
            ]
          }
        ]
      }
    ]
  },
  "ml-nn-fundamentals": {
    "sections": [
      {
        "heading": "What a neural network actually is",
        "body": [
          {
            "type": "p",
            "text": "A **neural network** is a stack of linear transformations interleaved with nonlinear functions. That's it. Strip away the biology metaphors and you have **matrix multiply → squash → repeat** until you can map inputs to outputs."
          },
          {
            "type": "p",
            "text": "The power comes from the nonlinearity. Without it, ten stacked layers collapse to one — composition of linear maps is still linear. The squash is what lets the network bend space and learn curves."
          }
        ]
      },
      {
        "heading": "The forward pass, end to end",
        "body": [
          {
            "type": "p",
            "text": "Data flows **input → linear → activation → … → output**. Each layer applies `z = Wx + b`, then a nonlinearity `a = σ(z)`. The output of one layer is the input of the next."
          },
          {
            "type": "walkthrough",
            "title": "Forward pass through a 2-hidden-layer network",
            "why": "Every layer runs the same recipe — `Wx + b` then squash — and feeds its output straight into the next.",
            "height": 240,
            "nodes": [
              {
                "id": "x",
                "label": "Input x",
                "subtitle": "vector ∈ ℝⁿ",
                "x": 0.3,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "h1",
                "label": "Hidden 1",
                "subtitle": "W₁x+b₁ → ReLU",
                "x": 0.7,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "h2",
                "label": "Hidden 2",
                "subtitle": "W₂a+b₂ → ReLU",
                "x": 0.3,
                "y": 0.85,
                "accent": "sky"
              },
              {
                "id": "out",
                "label": "Softmax",
                "subtitle": "class probs",
                "x": 0.7,
                "y": 0.85,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Input arrives",
                "description": "The network starts with a feature **vector `x`** — an image, a row of data, an embedding. Whatever it is, it's just numbers in ℝⁿ.",
                "activeNodes": ["x"],
                "activeEdges": []
              },
              {
                "title": "First hidden layer",
                "description": "Apply `z = W₁x + b₁`, then **ReLU** to get activation `a₁`. This layer learns a first set of combinations from the raw input.",
                "activeNodes": ["x", "h1"],
                "activeEdges": [{ "from": "x", "to": "h1", "label": "x" }]
              },
              {
                "title": "Second hidden layer",
                "description": "Feed `a₁` into the **same recipe** — `W₂a₁ + b₂` then ReLU — producing `a₂`. Stacking layers is what lets the net model complex shapes.",
                "activeNodes": ["h1", "h2"],
                "activeEdges": [{ "from": "h1", "to": "h2", "label": "a₁" }]
              },
              {
                "title": "Softmax output",
                "description": "The final layer turns `a₂` into **class probabilities** that sum to 1. The forward pass is done — every step was just a transform feeding the next.",
                "activeNodes": ["h2", "out"],
                "activeEdges": [{ "from": "h2", "to": "out", "label": "a₂" }]
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import torch.nn as nn  # PyTorch building blocks\n\nclass MLP(nn.Module):\n    def __init__(self, d_in, d_h, d_out):\n        super().__init__()\n        self.fc1 = nn.Linear(d_in, d_h)  # W₁ shape (d_h, d_in)\n        self.fc2 = nn.Linear(d_h, d_h)  # second hidden layer\n        self.out = nn.Linear(d_h, d_out)  # logits, not probs\n        self.act = nn.ReLU()  # cheap, no saturation\n\n    def forward(self, x):\n        x = self.act(self.fc1(x))  # linear then squash\n        x = self.act(self.fc2(x))  # same recipe again\n        return self.out(x)  # softmax lives in loss"
          }
        ]
      },
      {
        "heading": "Picking an activation function",
        "body": [
          {
            "type": "p",
            "text": "The squash matters. **Sigmoid** and **tanh** saturate — their gradient flattens to zero for large inputs, which kills learning in deep stacks. **ReLU** dominates modern nets because its gradient is exactly 1 on the active half."
          },
          {
            "type": "table",
            "headers": [
              "Function",
              "Range",
              "Gradient survives?",
              "When to use"
            ],
            "align": [
              "left",
              "center",
              "center",
              "left"
            ],
            "rows": [
              [
                "Sigmoid σ(z)",
                "(0, 1)",
                "✗ saturates",
                "Binary output layer only"
              ],
              [
                "Tanh",
                "(−1, 1)",
                "✗ saturates",
                "Shallow nets, RNN gates"
              ],
              [
                "ReLU max(0,z)",
                "[0, ∞)",
                "✓ on positive half",
                "Default for hidden layers"
              ],
              [
                "Leaky ReLU",
                "(−∞, ∞)",
                "✓ everywhere",
                "When ReLU units die"
              ],
              [
                "GELU",
                "(−0.17, ∞)",
                "✓ smooth",
                "Transformers, modern LLMs"
              ],
              [
                "Softmax",
                "(0, 1), sums to 1",
                "✓ via cross-entropy",
                "Multi-class output layer"
              ]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "ReLU wins because",
            "watchLabel": "But watch for",
            "good": [
              "Gradient is 1 or 0 — no vanishing on the active path",
              "One comparison per neuron — cheaper than `exp()`",
              "Sparse activations help generalization"
            ],
            "watch": [
              "**Dying ReLU**: a neuron stuck at z<0 gets zero gradient forever",
              "Unbounded output can blow up without normalization",
              "Not zero-centered, which slows convergence slightly"
            ]
          }
        ]
      },
      {
        "heading": "The vocabulary you need to read any paper",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Weights (W)",
                "def": "Learned matrices that transform layer inputs; shape `(d_out, d_in)`."
              },
              {
                "term": "Bias (b)",
                "def": "Per-neuron offset added after the matmul; lets a neuron fire at non-zero input."
              },
              {
                "term": "Logit",
                "def": "The raw pre-softmax output — unnormalized score for each class."
              },
              {
                "term": "Loss",
                "def": "Scalar measuring prediction error; cross-entropy for classification, MSE for regression."
              },
              {
                "term": "Backprop",
                "def": "Chain rule applied layer-by-layer to compute ∂loss/∂W for every weight."
              },
              {
                "term": "Epoch",
                "def": "One full pass over the training set; you typically train for many."
              }
            ]
          }
        ]
      },
      {
        "heading": "Key insight: depth buys you compositions",
        "body": [
          {
            "type": "p",
            "text": "A single hidden layer with enough neurons can approximate any function (universal approximation). But **depth beats width** in practice — stacked layers learn *features of features*, which is exponentially more efficient than memorizing one giant lookup."
          },
          {
            "type": "quote",
            "text": "We don't need more neurons. We need more layers.",
            "cite": "the deep learning revolution, paraphrased"
          },
          {
            "type": "reveal",
            "question": "Why does dropout regularize a neural network?",
            "answer": "At each training step, **dropout randomly zeros a fraction of activations** (typically 10–50%). The network can never depend on any single neuron being present, so it learns **redundant, distributed representations** instead of memorizing specific co-activation patterns. Mathematically it approximates training an exponential ensemble of subnetworks and averaging them at inference — ensembling on the cheap. At eval time dropout is off and weights are scaled, so the full network acts like the averaged ensemble."
          },
          {
            "type": "p",
            "text": "**Watch out for**: deeper isn't always better. Past ~10 layers without residual connections, gradients vanish and training stalls. That's why **ResNets**, **batch norm**, and **careful initialization** exist — they're all engineering tricks to keep the gradient signal alive through depth."
          }
        ]
      }
    ]
  },

  // ─── ADVANCED APPLIED (mleng — first is gan-gen) ──────────────────────────
  "ml-applied-gan-gen": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          { "type": "p", "text": "**Two students study together for the same exam — except one student is a counterfeiter and the other is a fraud cop.** The counterfeiter draws fake hundred-dollar bills; the cop tries to spot them. Every time the cop catches a fake, both learn. Every time the cop is fooled, both learn. Eventually the counterfeiter's bills are indistinguishable from real ones. That's a GAN." }
        ]
      },
      {
        "heading": "The GAN setup",
        "body": [
          { "type": "p", "text": "Train two networks in tandem. The **generator** maps random noise `z` to a fake sample `G(z)`. The **discriminator** is a classifier that takes a sample and outputs P(real). Their losses are opposite: D wants to maximize P(real) on real data and P(fake) on generated data; G wants D to be wrong." },
          { "type": "code", "lang": "txt", "text": "min_G max_D  𝔼[log D(x)] + 𝔼[log(1 − D(G(z)))]" }
        ]
      },
      {
        "heading": "Why they're hard to train",
        "body": [
          { "type": "ul", "items": [
            "**Mode collapse** — G discovers one fake that fools D and generates only that.",
            "**Vanishing discriminator** — if D gets too good too fast, G's gradients flatten and learning stalls.",
            "**Balance is fragile** — the loss curves look meaningless; you have to *look* at samples to know if training is working."
          ]}
        ]
      },
      {
        "heading": "Diffusion: GAN's quieter cousin",
        "body": [
          { "type": "p", "text": "Modern image generation (Stable Diffusion, Midjourney) mostly isn't GANs anymore — it's **diffusion**. Take a real image, add a tiny bit of noise, train a model to remove that noise. Apply the model many times to pure noise and you've sampled a new image. Slower than GANs at inference, but vastly more stable to train and the quality is unmatched." }
        ]
      },
      {
        "heading": "What they're used for",
        "body": [
          { "type": "ul", "items": [
            "Image, video, and audio synthesis.",
            "Data augmentation (generating extra training data for downstream models).",
            "Style transfer, super-resolution, inpainting.",
            "Adversarial robustness studies — using G to attack other models."
          ]}
        ]
      }
    ]
  },

  // ─── AGILE MINDSET (swe — first is what) ──────────────────────────────────
  "ml-nn-backprop": {
    "sections": [
      {
        "heading": "Forward, then backward",
        "body": [
          {
            "type": "p",
            "text": "**Backprop is the chain rule applied at industrial scale.** Your network has millions of parameters and one loss number — backprop tells you *which knob to turn, and which way,* to make that number smaller. Every model you've ever used (GPT, ResNet, AlphaFold) trains this way."
          },
          {
            "type": "p",
            "text": "The loop has two halves. **Forward pass:** push a batch through the layers, compute predictions, compute loss. **Backward pass:** walk the graph in reverse, asking each weight *how much did you contribute to this error?* Then nudge it in the opposite direction. Repeat a few million times."
          },
          {
            "type": "walkthrough",
            "title": "Forward / backward through a 3-layer net",
            "why": "Training is one round trip: data flows forward to a loss, then gradients flow backward to every weight.",
            "nodes": [
              {
                "id": "x",
                "label": "Input x",
                "subtitle": "batch",
                "x": 0.05,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "l1",
                "label": "Layer 1",
                "subtitle": "W₁, b₁",
                "x": 0.28,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "l2",
                "label": "Layer 2",
                "subtitle": "W₂, b₂",
                "x": 0.5,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "l3",
                "label": "Layer 3",
                "subtitle": "W₃, b₃",
                "x": 0.72,
                "y": 0.85,
                "accent": "sky"
              },
              {
                "id": "loss",
                "label": "Loss L",
                "subtitle": "scalar",
                "x": 0.93,
                "y": 0.85,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Forward: feed the batch in",
                "description": "A **batch** of examples `x` enters the network. The forward pass begins — data moves strictly left to right.",
                "activeNodes": ["x"],
                "activeEdges": []
              },
              {
                "title": "Forward: through layers 1 and 2",
                "description": "Each layer applies its `W·a + b` and a nonlinearity, handing its output to the next. By Layer 2 the input has been transformed twice.",
                "activeNodes": ["x", "l1", "l2"],
                "activeEdges": [
                  { "from": "x", "to": "l1", "label": "forward" },
                  { "from": "l1", "to": "l2" }
                ]
              },
              {
                "title": "Forward: reach the loss",
                "description": "Layer 3 produces predictions, and the **loss `L`** collapses them into a single scalar — how wrong the network was on this batch.",
                "activeNodes": ["l2", "l3", "loss"],
                "activeEdges": [
                  { "from": "l2", "to": "l3" },
                  { "from": "l3", "to": "loss" }
                ]
              },
              {
                "title": "Backward: gradient leaves the loss",
                "description": "Now reverse. **Backprop** starts at `L` and computes `∂L/∂(layer 3)` — how much Layer 3's weights drove the error.",
                "activeNodes": ["loss", "l3"],
                "activeEdges": [{ "from": "loss", "to": "l3", "label": "∇ backward" }]
              },
              {
                "title": "Backward: chain rule down the stack",
                "description": "The **chain rule** carries the gradient from Layer 3 to Layer 2 to Layer 1, multiplying local slopes along the way. Every weight learns its share of blame.",
                "activeNodes": ["l3", "l2", "l1"],
                "activeEdges": [
                  { "from": "l3", "to": "l2" },
                  { "from": "l2", "to": "l1" }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": "The update rule",
        "body": [
          {
            "type": "p",
            "text": "Once backprop hands you the **gradient** ∇L/∇w for every weight, gradient descent does the actual learning. The update is one line, and it's the same line in every framework on earth:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "w = w - η * ∇L_w  # η = learning rate, ∇L_w = gradient of loss wrt w\n#       ↑ subtract: gradient points UPHILL, we want to descend"
          },
          {
            "type": "p",
            "text": "The minus sign trips everyone up once. The gradient points in the direction of *steepest increase* of the loss — so to *decrease* loss you walk the other way. **η (learning rate)** controls step size: too small and training crawls, too large and you bounce out of the valley."
          },
          {
            "type": "p",
            "text": "In practice you don't compute the gradient over the whole dataset (too expensive). You sample a **mini-batch** — 32, 64, 256 examples — and use that noisy gradient estimate. That's **SGD** (stochastic gradient descent), and the noise actually helps escape bad local minima."
          }
        ]
      },
      {
        "heading": "Autodiff does it for you",
        "body": [
          {
            "type": "p",
            "text": "You will never hand-derive gradients in production. **Autodiff** (PyTorch, JAX, TensorFlow) builds a **computation graph** as your forward pass runs, then walks it backwards applying the chain rule mechanically. Your job is to write the forward pass clearly; the framework handles the calculus."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import torch                                  \n\nx = torch.tensor(2.0, requires_grad=True)    # track ops on x for autodiff\ny = x**3 + 2*x  # forward: builds graph behind the scenes\ny.backward()  # walks graph in reverse, fills .grad\n\nprint(x.grad)  # → tensor(14.) — matches 3x² + 2 at x=2"
          },
          {
            "type": "p",
            "text": "That's the whole game. Stack a million of those ops into a transformer, call `.backward()`, and PyTorch hands you a gradient for every parameter. Then your **optimizer** (`torch.optim.Adam`, SGD, etc.) applies the update rule above."
          }
        ]
      },
      {
        "heading": "Two failure modes that eat deep nets",
        "body": [
          {
            "type": "p",
            "text": "**80% of \"my model won't train\" bugs are gradient pathologies.** Specifically, two opposites — gradients that die, and gradients that explode. Both come from the chain rule multiplying many small or large numbers together as the signal flows backward through deep stacks."
          },
          {
            "type": "table",
            "headers": [
              "Problem",
              "Symptom",
              "Cause",
              "Fix"
            ],
            "align": [
              "left",
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "**Vanishing gradients**",
                "early layers stop learning, loss plateaus",
                "sigmoid/tanh saturate, ∇ shrinks to ~0 through many layers",
                "ReLU activations, residual connections, batch norm, careful init"
              ],
              [
                "**Exploding gradients**",
                "loss → NaN, weights blow up, training diverges",
                "∇ multiplies past 1.0 repeatedly through deep stack or RNN",
                "gradient clipping (`clip_grad_norm_`), smaller lr, better init"
              ],
              [
                "**Dead ReLU**",
                "neurons output 0 forever, never recover",
                "large negative bias pushes pre-activation always < 0",
                "Leaky ReLU, lower lr, He initialization"
              ],
              [
                "**Loss NaN at step 1**",
                "instant divergence",
                "lr way too high, or fp16 overflow",
                "lower lr 10×, enable mixed-precision loss scaling"
              ]
            ]
          },
          {
            "type": "p",
            "text": "The historical fix was clever: **residual connections** (ResNet, transformers) add a shortcut `x + f(x)` so the gradient has a clean highway back to early layers, bypassing the multiplicative decay. This single trick unlocked 100+ layer networks."
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
                "term": "Forgetting `optimizer.zero_grad()`",
                "def": "PyTorch *accumulates* gradients by default — skip the zero and each step adds to the last one, training silently corrupts."
              },
              {
                "term": "Learning rate is the first thing to tune",
                "def": "Before fancy architectures or data, sweep lr by powers of 10 — wrong lr beats every other bug for time wasted."
              },
              {
                "term": "Watch the gradient norm, not just the loss",
                "def": "Log `grad_norm` per step — a flatlined loss with zero gradients means dead network, not converged network."
              },
              {
                "term": "Mixed precision needs loss scaling",
                "def": "fp16 underflows tiny gradients to zero — frameworks scale loss up before backward, then unscale, to keep them representable."
              },
              {
                "term": "Detach when you don't want gradients",
                "def": "`tensor.detach()` or `torch.no_grad()` blocks autodiff — essential for inference, target networks, and avoiding memory blowups."
              }
            ]
          },
          {
            "type": "quote",
            "text": "Backprop didn't make neural nets possible — it made them *trainable at scale.* Everything since is a fight against the chain rule's tendency to vanish or explode.",
            "cite": "the bitter lesson, rephrased"
          }
        ]
      }
    ]
  },
  "ml-nn-embeddings": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a library where every book lives at a coordinate on a giant map.** Cookbooks cluster in one neighborhood, thrillers in another, and books *about* thrillers sit on the border between thriller-town and literary-criticism-ville. You never read the titles — you just look at the **address**, and similar books have similar addresses."
          },
          {
            "type": "p",
            "text": "That map is an **embedding space**. Each book is a point — a short list of numbers — and *distance* on the map means *semantic similarity* in the real world."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "An **embedding** is a learned vector — typically 64 to 4096 floats — that represents a discrete thing (a word, user, product, image patch) as a point in continuous space."
          },
          {
            "type": "p",
            "text": "You start with a giant lookup table: one row per item, randomly initialized. During training, the network nudges rows so that items appearing in *similar contexts* end up with *similar vectors*. The table **is** the model's vocabulary of meaning."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import torch.nn as nn\n\n# 50k vocab, 256-dim vectors\nembed = nn.Embedding(num_embeddings=50_000, embedding_dim=256)\n\ntoken_ids = torch.tensor([42, 7, 1984])\nvectors  = embed(token_ids)   # shape: (3, 256)"
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "The training signal comes from the **downstream task** — predict the next word, recommend the next song, classify the image. Gradients flow back through the lookup and reshape the space so useful structure emerges."
          },
          {
            "type": "p",
            "text": "The classic trick: vectors capture **relationships**, not just identity. `king − man + woman ≈ queen`. `Paris − France + Italy ≈ Rome`. Directions in the space encode concepts like *gender*, *capital-of*, *plural*."
          },
          {
            "type": "p",
            "text": "Similarity is measured with **cosine** or **dot product** — not Euclidean distance — because magnitude often encodes frequency, not meaning."
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Embeddings are the **universal adapter** between symbolic data and neural networks. Anything you can tokenize — words, SKUs, user IDs, DNA bases, log events — becomes a dense vector a model can reason over."
          },
          {
            "type": "ul",
            "items": [
              "**Search & RAG**: embed query + documents, retrieve nearest neighbors",
              "**Recommenders**: users and items share one space; dot-product = affinity",
              "**Transfer learning**: pretrained embeddings (`word2vec`, `BERT`, `CLIP`) bootstrap small datasets",
              "**Clustering**: k-means on embeddings finds natural groupings labels never captured"
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "Embeddings **inherit the biases of their training data** — gender stereotypes, regional slang gaps, stale product catalogs. Audit before you ship."
          },
          {
            "type": "ul",
            "items": [
              "**Cold start**: new items have random vectors until retrained",
              "**Dimensionality**: too small → collisions; too large → overfitting and slow `ANN` lookups",
              "**Drift**: meanings shift (`covid`, `cloud`) — schedule re-embeds",
              "**Distance ≠ truth**: nearest neighbor is often a *typo* or *near-duplicate*, not a *semantic match*"
            ]
          }
        ]
      }
    ]
  },
  "ml-nn-cnn": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a detective** sweeping a magnifying glass across a photograph, inch by inch. At each spot she isn't looking for the whole face — just one tiny clue: an edge, a curve, the corner of an eye. She slides the same lens everywhere because a clue is a clue no matter where it appears."
          },
          {
            "type": "p",
            "text": "A **convolutional neural network** (CNN) is that detective, automated. It slides small **filters** across an image, each tuned to a specific pattern, and stacks the findings into richer and richer evidence until the final layer can say *cat*."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "A CNN replaces the dense **weight matrix** of an MLP with small **kernels** (typically 3×3 or 5×5) that are *shared* across the input. Each kernel produces a **feature map** highlighting where its pattern fires."
          },
          {
            "type": "p",
            "text": "The architecture stacks three move types: **convolution** (detect patterns), **activation** (usually `ReLU`), and **pooling** (downsample, keep the strongest signal). Repeat this block, then flatten into a small dense head for the final prediction."
          },
          {
            "type": "ul",
            "items": [
              "**Kernel** — the learnable filter, e.g. an edge detector",
              "**Stride** — how far the kernel hops between taps",
              "**Padding** — zero-border to preserve spatial size",
              "**Channels** — depth: 3 for RGB in, *N* for stacked feature maps out"
            ]
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "Early layers learn **low-level features** — edges, color blobs, gradients. Middle layers compose those into **textures and parts** — fur, wheels, eyes. Deep layers assemble **objects and scenes**. Each layer's receptive field grows, so deeper neurons see more of the original image."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import torch.nn as nn\n\nclass TinyCNN(nn.Module):\n    def __init__(self, n_classes=10):\n        super().__init__()\n        self.features = nn.Sequential(\n            nn.Conv2d(3, 32, kernel_size=3, padding=1),  # 32 filters\n            nn.ReLU(),\n            nn.MaxPool2d(2),  # 32x32 -> 16x16\n            nn.Conv2d(32, 64, kernel_size=3, padding=1),\n            nn.ReLU(),\n            nn.MaxPool2d(2),  # 16x16 -> 8x8\n        )\n        self.head = nn.Linear(64 * 8 * 8, n_classes)\n\n    def forward(self, x):\n        x = self.features(x)\n        return self.head(x.flatten(1))"
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Two properties make CNNs dominate vision. **Weight sharing**: one kernel scans the whole image, so a cat detector trained on the left side also fires on the right — this is **translation equivariance**. **Local connectivity**: each neuron only looks at a small patch, slashing parameter count versus a dense net."
          },
          {
            "type": "p",
            "text": "A `224×224` RGB image into a dense layer needs ~150K weights *per neuron*. A `3×3×3` conv kernel needs *27*. That efficiency is why CNNs trained on modest hardware and ignited the 2012 deep-learning boom."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Not rotation-invariant** — a sideways cat looks alien unless you augment with rotations and flips.",
              "**Pooling discards location** — fine for *what*, bad for precise *where*; use strided convs or U-Net skips for segmentation.",
              "**Receptive field math** — if your object is bigger than the deepest neuron sees, the model can't reason about it. Count layers.",
              "**Vision Transformers** now match or beat CNNs at scale — but CNNs still win on small datasets and edge devices where inductive bias pays off."
            ]
          }
        ]
      }
    ]
  },
  "ml-nn-transformers": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a crowded dinner party** where you're trying to follow one conversation. Your brain doesn't weigh every voice equally — it **attends** to the speaker across from you, half-listens to the joke on your left, and ignores the clinking silverware. Every word you hear gets re-interpreted based on which other words you decided mattered."
          },
          {
            "type": "p",
            "text": "A **transformer** does exactly this with tokens. For every word, it asks: *which other words in this sentence should I lean on to understand you?* That weighted listening is **attention**, and stacking it is what makes ChatGPT, Claude, and BERT work."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "Each token becomes three vectors: a **query** (what am I looking for?), a **key** (what do I offer?), and a **value** (what do I actually pass along?). Attention scores every query against every key, softmaxes the scores, and uses them to mix the values."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Attention(Q, K, V) = softmax( Q · Kᵀ / √d_k ) · V\n\nQ, K, V ∈ ℝ^(n × d_k)\nscaling by √d_k keeps the dot products from blowing up\nsoftmax turns raw scores → probabilities that sum to 1"
          },
          {
            "type": "p",
            "text": "**Multi-head attention** runs this h times in parallel with different learned projections, then concatenates. One head might track subject-verb agreement, another long-range coreference. You don't program the roles — they emerge from gradient descent."
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "A transformer block sandwiches attention between **residual connections**, **layer norm**, and a small **feed-forward network**. Stack 12, 32, or 96 of these and you have GPT-scale capacity."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def transformer_block(x):\n    # x shape: (batch, seq_len, d_model)\n    a = multi_head_attention(layer_norm(x))\n    x = x + a  # residual\n    f = feed_forward(layer_norm(x)) # 2-layer MLP, GELU\n    return x + f  # residual"
          },
          {
            "type": "p",
            "text": "Because attention is permutation-invariant, you inject order with **positional encodings** (sinusoidal or learned, now mostly **RoPE**). Without them, *'dog bites man'* and *'man bites dog'* look identical."
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Transformers killed RNNs because attention is **parallelizable** — every token sees every other token in one matmul, so GPUs stay saturated. Training time per token dropped roughly an order of magnitude versus LSTMs."
          },
          {
            "type": "p",
            "text": "They also **scale predictably**. Double the parameters, double the data, and loss drops along a clean power law. That predictability is why labs keep writing nine-figure checks for bigger runs."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Quadratic cost**: attention is O(n²) in sequence length. A 100k-token context is 100× the compute of 10k. Flash Attention helps memory, not asymptotics.",
              "**Position drift**: models trained at 4k tokens degrade hard at 32k unless you use RoPE scaling, ALiBi, or fine-tune the extension.",
              "**Attention ≠ explanation**: high attention weights look interpretable but don't reliably tell you *why* the model decided something. Don't ship them as audit trails.",
              "**Tokenizer lock-in**: change the tokenizer and every learned embedding is garbage. Pick BPE or SentencePiece deliberately, then freeze it."
            ]
          }
        ]
      }
    ]
  },
  "ml-nn-llm-intro": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture an absurdly well-read intern** who has skimmed most of the public internet and can finish almost any sentence you start. Hand them the first half of a recipe, a legal brief, or a Python function — they will keep writing in the same voice, with eerie fluency."
          },
          {
            "type": "p",
            "text": "They have no memory of yesterday and no real understanding of truth. They are a **next-token autocomplete** with taste, polished by humans who rewarded the answers that sounded helpful."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "A **Large Language Model** is a deep neural network — almost always a **transformer** — trained to predict the next **token** given everything before it. Tokens are sub-word chunks like ` learning` or `Infra`."
          },
          {
            "type": "p",
            "text": "Scale is the trick. Billions of parameters θ, trillions of training tokens, and a single objective: minimize the loss on predicting the next token across the entire training corpus."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "P(token_t | token_1 ... token_{t-1}; θ)\nloss = -∑ log P(token_t | context; θ)"
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "Training happens in three stages. Each one shapes a different layer of the model's behavior."
          },
          {
            "type": "ol",
            "items": [
              "**Pretraining** — predict the next token on a giant text corpus. This is where world knowledge and grammar are absorbed.",
              "**Supervised fine-tuning (SFT)** — train on curated instruction → response pairs so the model follows requests instead of just continuing them.",
              "**RLHF / preference tuning** — humans rank outputs, a reward model learns their taste, and the LLM is nudged toward responses people prefer."
            ]
          },
          {
            "type": "p",
            "text": "At inference, you feed the model a **prompt**, it produces a probability distribution over the next token, you **sample** one (with knobs like `temperature` and `top_p`), append it, and repeat until a stop token."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic\n\nclient = Anthropic()\nresp = client.messages.create(\n    model=\"claude-opus-4-7\",\n    max_tokens=256,\n    messages=[{\"role\": \"user\", \"content\": \"Explain LLMs in one line.\"}],\n)\nprint(resp.content[0].text)"
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "LLMs collapsed dozens of bespoke NLP pipelines — classification, summarization, translation, code completion — into a single **prompt-driven** interface. That is why they sit at the center of modern AI products and **agentic** systems."
          },
          {
            "type": "p",
            "text": "For an MLOps engineer, the unit of work shifts. Instead of training a model per task, you operate one giant model and engineer the **context** around it: prompts, retrieved documents, tools, and evaluation harnesses."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Hallucinations** — confidently wrong text. The model optimizes for plausibility, not truth. Ground it with retrieval and citations.",
              "**Context window limits** — every token in the prompt and output counts. Long chats silently get truncated or summarized.",
              "**Stale knowledge** — pretraining has a cutoff date. Anything after it must come from tools or **RAG**.",
              "**Cost and latency** — output tokens dominate the bill. Cache aggressively, stream responses, and pick the smallest model that passes your evals.",
              "**Prompt injection** — untrusted text in the context can override your instructions. Treat retrieved documents like user input, not like code."
            ]
          }
        ]
      }
    ]
  },
  "ml-applied-rl": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture training a dog with treats.** You don't hand it a manual on 'sit'. You wait, and when the dog happens to lower its rear, you toss a treat. After enough rounds, the dog learns that the *action* of sitting in *that context* produces *reward*. It never saw a labeled dataset of correct poses."
          },
          {
            "type": "p",
            "text": "**Reinforcement learning** is that loop, formalized. An **agent** takes actions in an **environment**, observes a new **state** and a scalar **reward**, and slowly figures out a **policy** — a mapping from states to actions — that maximizes long-term reward."
          }
        ]
      },
      {
        "heading": "The model",
        "body": [
          {
            "type": "p",
            "text": "RL is framed as a **Markov Decision Process**: states `s`, actions `a`, transition probabilities `P(s'|s,a)`, and a reward function `R(s,a)`. The agent's goal is to maximize the **expected discounted return** — future rewards count, but less than immediate ones."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Return:   G_t = ∑ γᵏ · r_(t+k+1)     for k = 0..∞\nValue:    V(s) = E[ G_t | s_t = s ]\nQ-value:  Q(s,a) = E[ G_t | s_t = s, a_t = a ]\n\nBellman update:\nQ(s,a) ← Q(s,a) + η · ( r + γ · max_a' Q(s',a') − Q(s,a) )"
          },
          {
            "type": "p",
            "text": "Here `γ` is the **discount factor** (0.9-0.99 typical) and `η` is the learning rate. The bracketed term is the **TD error** — the surprise between what you predicted and what actually happened."
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "Two big families. **Value-based** methods (Q-learning, DQN) learn `Q(s,a)` and act greedily. **Policy-based** methods (REINFORCE, PPO) parameterize the policy `π_θ(a|s)` directly and follow `∇_θ` of expected reward. **Actor-critic** does both."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Sketch of a Q-learning step\nfor episode in range(N):\n    s = env.reset()\n    while not done:\n        a = epsilon_greedy(Q, s, eps)  # explore vs exploit\n        s_next, r, done = env.step(a)\n        td = r + gamma * Q[s_next].max() - Q[s][a]\n        Q[s][a] += eta * td\n        s = s_next"
          },
          {
            "type": "p",
            "text": "The **exploration-exploitation** knob is everything. Too greedy and you lock onto a mediocre policy. Too random and you never commit. `ε`-greedy, softmax sampling, or entropy bonuses in PPO are the usual tools."
          }
        ]
      },
      {
        "heading": "Where it shows up",
        "body": [
          {
            "type": "ul",
            "items": [
              "**RLHF** — fine-tuning LLMs against a reward model trained from human preferences.",
              "**Robotics and control** — locomotion, grasping, drone flight where dynamics are hard to model analytically.",
              "**Recommender and ad ranking** — long-horizon engagement instead of next-click prediction.",
              "**Operations** — datacenter cooling, ride dispatch, inventory, chip-floorplan placement."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "**Reward hacking.** Agents optimize the reward you wrote, not the one you meant. A cleaning bot rewarded for 'dust collected' will tip over the dustbin. Spend more time on the reward function than on the algorithm."
          },
          {
            "type": "p",
            "text": "**Sample inefficiency.** RL often needs millions of episodes. Use a **simulator**, **offline RL** on logged data, or **model-based** methods when real interactions are expensive. And expect training to be *non-stationary* — small hyperparameter changes can flip a run from solved to garbage."
          },
          {
            "type": "p",
            "text": "Reach for RL only when you have a clear reward signal, a cheap environment to roll out in, and a sequential decision problem. If a labeled dataset would do the job, use **supervised learning** instead."
          }
        ]
      }
    ]
  },
  // Agile (swe) stubs
  "sd-gpu-memory-budget": {
    "sections": [
      {
        "heading": "The analogy",
        "body": [
          {
            "type": "p",
            "text": "**Picture a chef working in a tiny food-truck kitchen.** The fridge holds 80 GB of ingredients. The dish (the model) takes up shelf space whether you're cooking or not. The mise en place (activations) only exists during the cook. Sauce reductions (optimizer states) sit in their own pots. Run out of space and the whole shift halts."
          },
          {
            "type": "p",
            "text": "Your GPU is that fridge. The four things competing for those 80 GB are **parameters**, **gradients**, **optimizer state**, and **activations** — and they don't scale the same way. Understanding which one is squeezing you is the whole game."
          }
        ]
      },
      {
        "heading": "The four buckets",
        "body": [
          {
            "type": "p",
            "text": "For a model with `N` parameters in mixed-precision (fp16/bf16 + fp32 master weights), the rough VRAM cost looks like this:"
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "params (fp16)      = 2N bytes\ngradients (fp16)   = 2N bytes\noptimizer (Adam)   = 8N bytes   ← momentum + variance in fp32\nactivations        ∝ batch · seq_len · hidden · layers"
          },
          {
            "type": "p",
            "text": "So a 7B-parameter LLM costs ~12N = **84 GB** just to *sit there* under Adam — before you've stored a single activation. That's why a 7B model won't fit on one 80 GB H100 for training even though it 'fits for inference'."
          }
        ]
      },
      {
        "heading": "Gradient accumulation — fake a bigger batch",
        "body": [
          {
            "type": "p",
            "text": "Activations grow linearly with batch size. When you OOM on `batch=32`, you don't actually need 32 samples in memory simultaneously — you need 32 samples' worth of *gradient* before the optimizer step. **Gradient accumulation** runs `batch=4` eight times, sums the grads, then steps once. Same math, one-eighth the activation memory."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "accum_steps = 8\nfor i, batch in enumerate(loader):\n    loss = model(batch) / accum_steps\n    loss.backward()  # grads accumulate in .grad\n    if (i + 1) % accum_steps == 0:\n        optimizer.step()\n        optimizer.zero_grad()"
          },
          {
            "type": "p",
            "text": "Cost: throughput drops because each effective step is 8 forward+backward passes. Benefit: you keep the convergence properties of a large batch on hardware that couldn't host it."
          }
        ]
      },
      {
        "heading": "When to reach for which lever",
        "body": [
          {
            "type": "ul",
            "items": [
              "**OOM on activations** (small model, long sequences) → gradient checkpointing first, then accumulation.",
              "**OOM on optimizer state** (large model, Adam) → switch to 8-bit Adam or ZeRO stage 1.",
              "**OOM on params + grads** (model genuinely too big) → you need model/pipeline parallel, not a knob.",
              "**OOM only on the first step** → mixed-precision scaler is allocating fp32 buffers; warm it up."
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "There is no single 'memory used' number to optimize. Each bucket scales by a different lever — params by sharding, grads by accumulation, optimizer by quantization, activations by checkpointing. When someone says *'we're GPU-bound'*, the senior question is **which of the four**. Get that wrong and you'll spend a week tuning the wrong knob."
          }
        ]
      }
    ]
  },
  "sd-parallelism-topologies": {
    "sections": [
      {
        "heading": "The default bridge",
        "body": [
          {
            "type": "p",
            "text": "**Imagine a 20-person team translating one enormous book.** You can hand everyone their own copy and split the chapters (everyone works in parallel on different content). Or you can split the *book itself* across people — one keeps glossary, one keeps grammar, one keeps idioms — and they pass paragraphs through an assembly line. Or you can chop each page in half horizontally and have two people split the sentences."
          },
          {
            "type": "p",
            "text": "Those three setups are **data parallel**, **pipeline parallel**, and **tensor (model) parallel** — and almost every large-model training run is some combination of all three."
          }
        ]
      },
      {
        "heading": "Data parallel — same model, different batch",
        "body": [
          {
            "type": "p",
            "text": "Every GPU holds a full copy of the model. The batch is sliced across GPUs; each does its own forward+backward; gradients get **all-reduced** before the optimizer step. Simple, well-understood, the default in PyTorch DDP."
          },
          {
            "type": "p",
            "text": "It breaks when **the model doesn't fit on one GPU**. A 70B parameter model needs ~1 TB just for optimizer state under Adam — no single device has that. ZeRO (DeepSpeed) is a clever middle ground: it shards optimizer state, gradients, then params across the data-parallel replicas, keeping the data-parallel programming model while removing the duplicate storage."
          }
        ]
      },
      {
        "heading": "Pipeline parallel — layers split, microbatches stream",
        "body": [
          {
            "type": "p",
            "text": "Split the model **vertically across layers**. GPU 0 holds layers 1-8, GPU 1 holds 9-16, etc. A batch flows through like an assembly line. The naive version wastes GPUs (everyone but the active stage is idle), so real systems use **microbatching**: feed many small chunks back-to-back so all stages are busy at once."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# GPipe-style: 4 stages, 8 microbatches → small bubble at start/end\nfrom torch.distributed.pipeline.sync import Pipe\nmodel = nn.Sequential(stage0, stage1, stage2, stage3)\nmodel = Pipe(model, chunks=8)   # 8 microbatches in flight"
          },
          {
            "type": "p",
            "text": "Cost: the **pipeline bubble** — idle time while the pipe fills and drains. Bubble ≈ `(stages − 1) / microbatches`. Eight microbatches across four stages → ~37% theoretical waste. More microbatches shrink it; too many starve each one of activations."
          }
        ]
      },
      {
        "heading": "Tensor parallel — single matmul, sharded weights",
        "body": [
          {
            "type": "p",
            "text": "Inside one layer, split the weight matrix **horizontally or vertically across GPUs** and have them compute partial results that get combined via all-reduce. Megatron-LM popularized this for transformers — `Q`, `K`, `V` projections shard cleanly across heads."
          },
          {
            "type": "p",
            "text": "Tensor parallel is communication-heavy: every layer needs an all-reduce. It only works *within* a node, over NVLink (~600 GB/s). Try it across nodes on regular networking and your GPUs idle on the network 80% of the time."
          }
        ]
      },
      {
        "heading": "How real clusters combine them",
        "body": [
          {
            "type": "p",
            "text": "**3D parallelism**: tensor parallel within a node (uses NVLink), pipeline parallel across nodes in the same pod (uses InfiniBand), data parallel across pods (uses the slowest network — only sees grads once per step). The topology maps to the hardware bandwidth hierarchy."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "TP=8  (within one node, NVLink)\nPP=4  (across nodes in a pod, IB)\nDP=16 (across pods)\n→ total GPUs = 8 · 4 · 16 = 512"
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "These aren't competing options — they're orthogonal axes, and large training picks a coordinate on each. The rule: **fastest interconnect gets the chattiest parallelism**. Tensor parallel needs NVLink. Pipeline parallel tolerates InfiniBand. Data parallel survives Ethernet. Mismatch this and your $50M cluster will run at 30% utilization."
          },
          {
            "type": "explain-back",
            "prompt": "You've now seen **data parallel**, **pipeline parallel**, and **tensor parallel** as three orthogonal axes. A 70B model won't fit on one GPU and won't even fit its optimizer state in a single node. Lay out a 3D-parallel plan across a cluster of 8-GPU NVLink nodes wired together with InfiniBand, mapping each parallelism axis to the right layer of the bandwidth hierarchy. Explain *why* each axis lands where it does, and name the one mismatch that would tank utilization.",
            "modelAnswer": "Map the chattiest parallelism to the fastest wire. **Tensor parallel goes *within* a node, over NVLink** (~600 GB/s): TP needs an all-reduce on every single layer, so it can only survive the highest-bandwidth interconnect — set TP=8 to use all GPUs in a node and also to split the weights/optimizer state that won't fit on one device. **Pipeline parallel goes *across* nodes within a pod, over InfiniBand**: it only passes activations at stage boundaries, so it tolerates the slower-but-still-fast IB link; use enough microbatches to keep the pipeline bubble (~`(stages−1)/microbatches`) small. **Data parallel goes *across* pods, over the slowest network**: replicas only all-reduce gradients once per step, so they survive ordinary Ethernet — and layer ZeRO on top to shard optimizer state across replicas so the 70B's ~1 TB of Adam state isn't duplicated. So total GPUs = TP · PP · DP. **The mismatch that tanks utilization is putting a chatty axis on a slow wire** — e.g. tensor-parallel *across* nodes instead of within one. Then every layer's all-reduce waits on the network and the GPUs idle ~80% of the time, leaving a $50M cluster running at ~30% utilization.",
            "hint": "Rank the three axes by how often they communicate (TP every layer > PP every stage > DP once per step), rank the wires by bandwidth (NVLink > IB > Ethernet), and pair them off. The trap is a chatty axis on a slow wire.",
            "commit": {
              "q": "Which parallelism axis must stay INSIDE a single NVLink node, or utilization tanks?",
              "opts": [
                "Data parallel",
                "Pipeline parallel",
                "Tensor parallel"
              ],
              "answer": 2,
              "why": "Tensor parallel communicates the most often of the three axes, so only the fastest wire can feed it. Rank the other two by chattiness and the rest of the mapping falls out."
            }
          }
        ]
      }
    ]
  },
  "sd-batch-size-lr-coupling": {
    "sections": [
      {
        "heading": "The hidden coupling",
        "body": [
          {
            "type": "p",
            "text": "**Imagine you're walking down a foggy hillside trying to reach the bottom.** Each step, you look at the slope under your feet and step in that direction. If you only check the slope every 100 meters (large batch, accurate gradient), you can confidently take big strides. If you check every 1 meter (small batch, noisy gradient), small cautious steps are safer or you'll trip on the noise."
          },
          {
            "type": "p",
            "text": "That's the **linear scaling rule**: when you multiply batch size by `k`, multiply learning rate by `k` too. The gradient gets `√k` more accurate but you take `k` fewer steps per epoch — so to cover the same ground, each step has to be `k` times bigger."
          },
          {
            "type": "predict",
            "prompt": "Your laptop trains stably at batch size 32, learning rate 3e-4. You move the same code to a cluster and run batch size 4096 — 128× larger — with **the original learning rate unchanged**. What happens first?",
            "options": [
              "Training converges 128× faster — more data per step is strictly better",
              "Training converges to the same loss, just slower in wall-clock",
              "Training stalls — gradients are accurate but the implicit step size is now ~128× too small for the same number of epochs",
              "Training diverges — random init plus huge first gradients with no warmup blows up the loss"
            ],
            "answer": 2,
            "explain": "With LR fixed and batch size 128×, each step still moves θ by `η · ∇L`, but you now take 128× *fewer* steps per epoch (same data, bigger chunks). Total progress per epoch collapses, so within the same epoch budget you get a model that's barely trained — the loss curve flattens way above where the 32-batch run landed. The linear scaling rule says to also bump LR by ~128× to compensate, which restores per-epoch progress. The 'diverges' answer is what happens if you bump LR but forget **warmup** — random init + huge first step is what kills you there. Get both right and the cluster is a real speedup."
          }
        ]
      },
      {
        "heading": "The math",
        "body": [
          {
            "type": "code",
            "lang": "txt",
            "text": "SGD step:  θ ← θ − η · (1/B) · ∑ ∇L(xᵢ)\n\nDouble B → grad estimate halves variance, but you take half as many steps.\nKeep total progress per epoch constant → double η."
          },
          {
            "type": "p",
            "text": "This is why a 'good' learning rate from your laptop experiments (`B=32`) blows up when you scale to a cluster (`B=4096`). You didn't change the model. You changed the implicit step size — by 128×."
          }
        ]
      },
      {
        "heading": "Where linear scaling breaks",
        "body": [
          {
            "type": "p",
            "text": "The rule holds in a *middle regime*. Beyond a model-dependent **critical batch size**, returns flatten — you're not learning faster, you're just consuming more compute per step. McCandlish et al. (2018) showed this critical batch grows during training as gradients become more aligned."
          },
          {
            "type": "ul",
            "items": [
              "**Below critical** — linear scaling works, η grows with B, convergence in fixed wall-clock improves.",
              "**At critical** — you're using batches as large as the optimization problem can absorb.",
              "**Above critical** — extra GPUs buy you nothing; you're wasting silicon on redundant samples."
            ]
          }
        ]
      },
      {
        "heading": "Warmup — the start of training is fragile",
        "body": [
          {
            "type": "p",
            "text": "At step 0, weights are random; gradients are huge and chaotic. A large batch with a high LR will immediately diverge. **Linear LR warmup** ramps η from ~0 up to target over the first ~1000 steps, letting weights settle before the big strides start."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from torch.optim.lr_scheduler import LambdaLR\n\nwarmup_steps = 1000\ndef warmup(step):\n    return min(1.0, step / warmup_steps)\n\nscheduler = LambdaLR(optimizer, lr_lambda=warmup)"
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "When someone says *'we scaled training to 1024 GPUs and it diverged'*, the answer is almost never *'use a different optimizer'*. It's **batch size and learning rate are the same lever, and you only pulled one of them**. The senior move on a training PR review is to ask: what was the effective batch size, what was the LR, and did warmup hold?"
          }
        ]
      }
    ]
  },
  "sd-inference-vs-training-cost": {
    "sections": [
      {
        "heading": "The two cost shapes",
        "body": [
          {
            "type": "p",
            "text": "**Picture two businesses sharing the same kitchen.** One is a movie production company — it spends six months and $20M filming, and once the film is done, copies cost pennies. The other is a restaurant — every plate it serves costs labor, ingredients, and time, and it serves *every day forever*."
          },
          {
            "type": "p",
            "text": "Training is the film shoot. Inference is the restaurant. They have opposite cost shapes, opposite bottlenecks, and the system you'd design for one will quietly fail the other."
          }
        ]
      },
      {
        "heading": "Training — bursty, compute-bound, batchy",
        "body": [
          {
            "type": "p",
            "text": "Training is **embarrassingly batched**. You control the batch size, you control when it runs, you don't care about latency — only throughput. The job is one big mostly-synchronous compute graph. The bottleneck is FLOPs and interconnect bandwidth."
          },
          {
            "type": "p",
            "text": "Cost model: one-time, *front-loaded*. A GPT-class run is on the order of `model_params × tokens × 6 FLOPs` (Chinchilla rule of thumb), then it's done. Buying or renting an H100 cluster for 30-90 days makes economic sense even at $4/hr/GPU."
          }
        ]
      },
      {
        "heading": "Inference — adversarial, latency-bound, jagged",
        "body": [
          {
            "type": "p",
            "text": "Inference traffic arrives from users at unpredictable times, in unpredictable shapes. The cost shifts:"
          },
          {
            "type": "ul",
            "items": [
              "**Latency matters** — a 2-second p99 instead of 200ms can kill conversion. You can't just wait for a full batch.",
              "**Memory bandwidth, not FLOPs** — autoregressive decoding does one token at a time. The GPU spends most cycles waiting for weights to load from HBM, not computing.",
              "**Long tail of request sizes** — one user asks for 50 tokens, another for 8000. Static batching wastes the small ones; padding wastes the large.",
              "**Cost is forever** — you pay for the model every second of every day it's deployed."
            ]
          }
        ]
      },
      {
        "heading": "How serving systems adapt",
        "body": [
          {
            "type": "p",
            "text": "Modern inference engines (vLLM, TensorRT-LLM, TGI) are built around two ideas that *don't exist* in training stacks:"
          },
          {
            "type": "ul",
            "items": [
              "**Continuous batching** — new requests slot into an in-flight batch every iteration, not every batch. Eliminates head-of-line blocking from a long request.",
              "**KV-cache management** — past tokens' attention keys/values are cached so decoding step `t` doesn't recompute steps 0..t-1. PagedAttention treats the cache like virtual memory pages so multiple sequences share a GPU efficiently."
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# vLLM server tuned for serving, not training\nmodel: meta-llama/Llama-3-70B\ntensor_parallel_size: 4  # split across 4 GPUs in one node\nmax_num_seqs: 256  # how many requests in flight\nmax_model_len: 8192\ngpu_memory_utilization: 0.92    # leave room for KV cache spikes\nenable_prefix_caching: true  # reuse system-prompt KV across users"
          }
        ]
      },
      {
        "heading": "The economic break-even nobody draws",
        "body": [
          {
            "type": "p",
            "text": "A useful back-of-envelope: a 70B model served at one H100 per replica, $4/hr, 24/7, runs ~$35k/year per replica. If your training cost was $200k, **you cross training cost in inference within 6 replicas, in one year**. Almost every real deployment spends more on inference over its lifetime than on training. Yet most ML orgs over-invest in training optimization and under-invest in serving."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Training optimizes for **throughput at any latency**. Inference optimizes for **latency at acceptable throughput**. They want different hardware (training likes interconnect; inference likes HBM bandwidth), different batching (static vs continuous), different precision (mixed for training stability, int8/fp8 for inference cost). When a team says *'we'll just deploy the training stack to prod'*, that's the moment a staff engineer politely says no."
          }
        ]
      }
    ]
  },
  "mleng-llm-apis": {
    "sections": [
      {
        "heading": "LLM APIs in production",
        "body": [
          {
            "type": "p",
            "text": "**A hosted LLM is a stateless function that costs real money per call.** OpenAI, Anthropic, Google, and Bedrock all expose roughly the same shape — `messages`, `model`, `temperature`, `max_tokens`, an optional `system` prompt — and bill you per input and output token. Every call needs an SLA in your head: latency budget, retry budget, cost ceiling."
          },
          {
            "type": "p",
            "text": "The hard parts aren't the happy path; they're streaming, rate limits, tool use, and cost. This lesson is the production checklist."
          },
          {
            "type": "diagram",
            "title": "LLM call lifecycle",
            "subtitle": "REQUEST · GATEWAY · WORKER · STREAM",
            "height": 220,
            "nodes": [
              { "id": "client", "label": "Client", "subtitle": "your app", "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "gw",     "label": "API gateway", "subtitle": "auth+rate", "accent": "amber", "x": 0.34, "y": 0.5 },
              { "id": "worker", "label": "Model worker", "subtitle": "decode", "accent": "fire", "x": 0.62, "y": 0.5 },
              { "id": "stream", "label": "Stream + cache", "subtitle": "SSE chunks · prompt cache", "accent": "sky", "x": 0.88, "y": 0.28 },
              { "id": "ledger", "label": "Cost ledger", "subtitle": "tokens · $ · logs", "accent": "earth", "x": 0.88, "y": 0.72 }
            ],
            "edges": [
              { "from": "client", "to": "gw",     "kind": "dashed", "label": "request" },
              { "from": "gw",     "to": "worker", "kind": "solid",  "accent": "fire",  "label": "decode" },
              { "from": "worker", "to": "stream", "kind": "dashed", "accent": "sky",   "label": "stream", "curve": 0.3 },
              { "from": "worker", "to": "ledger", "kind": "dashed", "accent": "earth", "label": "log", "curve": 0.3 },
              { "from": "gw",     "to": "client", "kind": "solid",  "accent": "amber", "label": "429", "curve": 0.4 }
            ]
          },
          {
            "type": "h3",
            "text": "The request shape"
          },
          {
            "type": "p",
            "text": "**Messages** are an array of `{role, content}` turns: `system` (rules + persona), `user` (the prompt), `assistant` (prior model turns). Everything you want the model to consider has to be in this list — there is no server-side memory."
          },
          {
            "type": "p",
            "text": "**Knobs**: `temperature` controls randomness (0 = deterministic-ish, 1 = creative), `max_tokens` caps the reply, and a `stop` list trims the tail. Production code pins `temperature=0` for anything you'll eval."
          },
          {
            "type": "table",
            "headers": ["Provider", "Streaming", "Tool use", "Prompt cache"],
            "rows": [
              ["OpenAI",    "SSE",      "yes",  "yes (input)"],
              ["Anthropic", "SSE",      "yes",  "yes (`cache_control`)"],
              ["Google",    "SSE",      "yes",  "yes (context cache)"],
              ["Bedrock",   "SSE + IAM","yes",  "varies by model"]
            ]
          },
          {
            "type": "h3",
            "text": "Streaming and retries"
          },
          {
            "type": "p",
            "text": "**Streaming** ships tokens as Server-Sent Events the moment the decoder emits them. Time-to-first-token drops from seconds to ~300 ms, which is the difference between a snappy UI and a frozen one. Non-streaming is simpler to log and parse — use it for batch jobs and tool calls you have to validate end-to-end."
          },
          {
            "type": "p",
            "text": "**Retries** are non-optional. Rate limits return `429`; transient gateway errors return `5xx`. Honor `Retry-After` if present, otherwise back off exponentially with jitter, and cap the retry budget per request (3 attempts, ~10 s total) so a degraded provider can't pile latency on top of latency."
          },
          {
            "type": "pros-cons",
            "goodLabel": "STREAMING GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Interactive UIs — first token in ~300 ms feels instant",
              "Long replies — user reads while the model writes",
              "Early-cancel on bad output — abort the HTTP stream and stop billing"
            ],
            "watch": [
              "Mid-stream errors arrive as event types, not HTTP status codes — parse them",
              "Tool-call JSON arrives in fragments — buffer until the message is complete",
              "Proxies and CDNs sometimes drop SSE — test through your real network path"
            ]
          },
          {
            "type": "h3",
            "text": "Cost controls"
          },
          {
            "type": "p",
            "text": "**Prompt caching** lets you mark a long, stable prefix (system prompt, retrieved docs) and pay ~10% of the input rate on cache hits. For a 4k-token system prompt called 100×/min, that's the difference between a real budget and a runaway bill."
          },
          {
            "type": "p",
            "text": "**Route by difficulty.** Cheap call first (Haiku-class), escalate to Sonnet only when the cheap one returns low confidence or hits a guardrail. The dumbest router that works beats the smartest one you didn't ship."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import anthropic\n\nclient = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env\n\nresp = client.messages.create(\n    model=\"claude-sonnet-4-6\",  # practical default for prod apps\n    max_tokens=512,  # hard cap — stops runaway outputs and runaway bills\n    temperature=0,  # deterministic-ish — required for honest eval\n    system=[{  # list form unlocks cache_control on the system prompt\n        \"type\": \"text\",\n        \"text\": \"You are a terse code reviewer. Return JSON only.\",\n        \"cache_control\": {\"type\": \"ephemeral\"},  # pay ~10% on cache hits\n    }],\n    messages=[\n        {\"role\": \"user\", \"content\": \"Review: def add(a,b): return a-b\"},  # user turn\n    ],\n    stream=False,  # set True for SSE; this path is for batch + eval\n)\nprint(resp.content[0].text)  # .content is a list of blocks — text is block 0"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Try changing the model or temperature.",
            "varName": "response",
            "starter": "# Sketch the request shape — no real API call here.\nrequest = {\n    \"model\": \"claude-sonnet-4-6\",  # swap to claude-haiku-4-5-20251001 for cheap\n    \"max_tokens\": 256,  # cap the bill per call\n    \"temperature\": 0,  # 0 = reproducible; 1 = creative\n    \"system\": \"You are a concise SRE.\",  # rules + persona\n    \"messages\": [\n        {\"role\": \"user\", \"content\": \"One-line fix for a 429 storm?\"},\n    ],\n}\n\n# Pretend we called the API — describe what we'd send back.\nresponse = {\n    \"model\": request[\"model\"],\n    \"temperature\": request[\"temperature\"],\n    \"shape_ok\": set(request.keys()) >= {\"model\", \"messages\", \"max_tokens\"},\n}\nprint(response)\n",
            "hint": "Bump `temperature` to 0.7 or switch `model` to `claude-haiku-4-5-20251001` — the response dict mirrors the request so you can see the change."
          },
          {
            "type": "quote",
            "text": "An LLM call is a function with a price tag. Treat it like one.",
            "cite": "the production LLM rule"
          }
        ]
      }
    ]
  },
  "mleng-prompting": {
    "sections": [
      {
        "heading": "Prompt engineering techniques",
        "body": [
          {
            "type": "p",
            "text": "**A prompt is a program written in English.** The model is your interpreter — it's stochastic, it has a context window, and it pays attention to structure. Good prompting is mostly: tell it the rules, show it examples, demand a shape."
          },
          {
            "type": "diagram",
            "title": "Prompt assembly",
            "subtitle": "SYSTEM · FEW-SHOT · USER · OUTPUT",
            "height": 220,
            "nodes": [
              { "id": "user",   "label": "User input",      "subtitle": "question",  "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "tmpl",   "label": "Prompt template", "subtitle": "rules",     "accent": "amber", "x": 0.36, "y": 0.5 },
              { "id": "llm",    "label": "LLM",             "subtitle": "claude",    "accent": "fire",  "x": 0.6, "y": 0.9 },
              { "id": "out",    "label": "Structured out",  "subtitle": "JSON",      "accent": "sky",   "x": 0.85, "y": 0.9 }
            ],
            "edges": [
              { "from": "user", "to": "tmpl", "kind": "dashed", "label": "slot in" },
              { "from": "tmpl", "to": "llm",  "kind": "solid",  "accent": "fire",  "label": "render" },
              { "from": "llm",  "to": "out",  "kind": "dashed", "accent": "sky",   "label": "parse" }
            ]
          },
          {
            "type": "h3",
            "text": "System vs user prompt"
          },
          {
            "type": "p",
            "text": "**System** is the role, the rules, the output contract — stable across calls so it caches. **User** is the variable input. Don't dump dynamic data into the system prompt or you'll burn your cache hit rate."
          },
          {
            "type": "p",
            "text": "**Be concise.** \"Return JSON only\" beats a 200-word policy. Every extra instruction is a tax on attention and a chance for the model to fixate on the wrong rule."
          },
          {
            "type": "h3",
            "text": "Few-shot, chain-of-thought, structure"
          },
          {
            "type": "table",
            "headers": ["Technique", "When to use", "Cost"],
            "rows": [
              ["Zero-shot",        "Simple, common task",       "Cheap"],
              ["Few-shot (2-5)",   "Format or edge cases tricky","+ input tokens"],
              ["Chain-of-thought", "Math, multi-step reasoning", "+ output tokens"],
              ["Structured (JSON)","You'll parse it downstream", "Free, more reliable"]
            ]
          },
          {
            "type": "interactive-viz",
            "viz": "fsrs-curve",
            "title": "Your forgetting curve, live",
            "caption": "Drag stability + difficulty. Click Review to see what spaced repetition buys you."
          },
          {
            "type": "p",
            "text": "**Chain-of-thought** = \"think step by step before answering\". Cheap accuracy bump on reasoning tasks, but doubles output tokens. Hide the thinking in `<thinking>` tags and strip before showing the user."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic\n\nclient = Anthropic()\n\nresp = client.messages.create(\n    model=\"claude-sonnet-4-6\",  # practical prod default\n    max_tokens=400,\n    temperature=0,  # eval-friendly\n    system=\"Classify the ticket. Return JSON: {category, urgency}.\",  # short, stable\n    messages=[\n        # few-shot example 1\n        {\"role\": \"user\",      \"content\": \"Login broken, prod down.\"},\n        {\"role\": \"assistant\", \"content\": '{\"category\":\"auth\",\"urgency\":\"p0\"}'},\n        # few-shot example 2\n        {\"role\": \"user\",      \"content\": \"Typo on the about page.\"},\n        {\"role\": \"assistant\", \"content\": '{\"category\":\"content\",\"urgency\":\"p3\"}'},\n        # real input\n        {\"role\": \"user\",      \"content\": \"Checkout returns 500 sometimes.\"},\n    ],\n)\nprint(resp.content[0].text)  # parseable JSON, not prose"
          },
          {
            "type": "pros-cons",
            "goodLabel": "PROMPTING GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Iteration speed — change a string, redeploy in seconds",
              "Format compliance — JSON, XML tags, fixed schemas",
              "Tone, persona, output length without retraining"
            ],
            "watch": [
              "Domain knowledge the base model lacks — that's RAG, not a longer prompt",
              "100+ line prompts — every rule competes for attention, accuracy drops",
              "Prompt drift — small wording changes silently break downstream parsing"
            ]
          },
          {
            "type": "h3",
            "text": "When fine-tuning wins"
          },
          {
            "type": "p",
            "text": "**Fine-tune when** you have >1k labeled examples AND the task is narrow AND latency or cost matters. Otherwise prompting + few-shot wins on dev velocity. RAG covers \"the model doesn't know our data\" — fine-tuning rarely does."
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Swap zero-shot for two-shot. Notice the schema lock.",
            "varName": "response",
            "starter": "# Simulated prompt builder — no real API call.\nsystem = \"Classify sentiment. Return JSON: {label, score}.\"\n\nfew_shot = [\n    (\"This is amazing!\",   '{\"label\":\"positive\",\"score\":0.95}'),\n    (\"Worst ever.\",        '{\"label\":\"negative\",\"score\":0.92}'),\n]\n\nuser_input = \"It was fine I guess.\"\n\nmessages = []\nfor u, a in few_shot:  # alternating turns = canonical few-shot shape\n    messages.append({\"role\": \"user\", \"content\": u})\n    messages.append({\"role\": \"assistant\", \"content\": a})\nmessages.append({\"role\": \"user\", \"content\": user_input})\n\nresponse = {\n    \"system\": system,\n    \"n_examples\": len(few_shot),\n    \"messages\": messages,\n    \"expects_json\": '\"label\"' in system,\n}\nprint(response)\n",
            "hint": "Try adding a third example, or change the schema to {sentiment, confidence}. The shape of `messages` is what the SDK actually sends."
          },
          {
            "type": "quote",
            "text": "Show, don't tell. Two examples beat two paragraphs of rules.",
            "cite": "the few-shot rule"
          },
          {
            "type": "explain-back",
            "prompt": "You've assembled a prompt from four moving parts: the **system/user split** (and its caching consequence), **few-shot examples**, **chain-of-thought**, and a **structured JSON output contract**. Design the prompt for a high-volume ticket classifier that must return parseable JSON, handle tricky edge cases, and stay cheap at scale. Explain what goes in the system message vs. the user turns and why, and name the trade-off you'd watch as volume grows.",
            "modelAnswer": "Put everything *stable* in the **system message** — the role, the rules, and the output contract (\"Return JSON only: {category, urgency}\") — because a fixed system prefix is what the provider's prompt cache can reuse across every call, so it should never carry the variable ticket text. The **few-shot examples** (2-5 alternating user/assistant turns) go right before the real input to lock the schema and cover the tricky edge cases that prose rules miss — \"show, don't tell.\" Reserve **chain-of-thought** for tickets that actually need multi-step reasoning, and even then hide it in `<thinking>` tags and strip it before parsing, because CoT roughly doubles output tokens. The **JSON contract** is what makes the result machine-readable instead of prose you'd regex. **The trade-off I'd watch as volume grows is cost vs. accuracy in the token budget**: every few-shot example and every chain-of-thought token is paid on *every* request forever, so at high volume I'd trim to the fewest examples that hold accuracy and turn CoT off for the easy majority class — and I'd freeze a graded eval set, because shaving the prompt to save tokens silently breaks downstream parsing if I'm not measuring.",
            "hint": "Stable bytes → system message (cacheable); variable input + examples → user turns. Then weigh: every example and every reasoning token is a tax paid on *every* request.",
            "commit": {
              "q": "In a high-volume ticket classifier, where should the fixed rules and JSON output contract live?",
              "opts": [
                "In the system message, before any variable input",
                "Repeated at the top of every user turn with the ticket",
                "Inside each few-shot assistant reply as a reminder"
              ],
              "answer": 0,
              "why": "A stable prefix is what the provider's prompt cache can reuse across calls — mixing variable ticket text into it breaks that reuse. That's one of the four parts; place the other three next."
            }
          }
        ]
      }
    ]
  },
  "mleng-rag": {
    "sections": [
      {
        "heading": "RAG: retrieval-augmented generation",
        "body": [
          {
            "type": "p",
            "text": "**RAG is how you make an LLM know your data without training it.** Chunk your docs, embed them, store in a vector DB, retrieve the top-k at query time, and stuff them into the prompt. Cheaper than fine-tuning, fresher than the model's cutoff."
          },
          {
            "type": "diagram",
            "title": "RAG pipeline",
            "subtitle": "CHUNK · EMBED · STORE · RETRIEVE · GENERATE",
            "height": 240,
            "nodes": [
              { "id": "q",     "label": "Query",        "subtitle": "question",  "accent": "water", "x": 0.06, "y": 0.5 },
              { "id": "emb",   "label": "Embedder",     "subtitle": "vector",    "accent": "amber", "x": 0.28, "y": 0.5 },
              { "id": "vdb",   "label": "Vector DB",    "subtitle": "top-k",     "accent": "earth", "x": 0.50, "y": 0.5 },
              { "id": "ctx",   "label": "Prompt + ctx", "subtitle": "stuff",     "accent": "amber", "x": 0.72, "y": 0.85 },
              { "id": "llm",   "label": "LLM",          "subtitle": "claude",    "accent": "fire",  "x": 0.94, "y": 0.85 }
            ],
            "edges": [
              { "from": "q",   "to": "emb", "kind": "dashed", "label": "encode" },
              { "from": "emb", "to": "vdb", "kind": "solid",  "accent": "earth", "label": "search" },
              { "from": "vdb", "to": "ctx", "kind": "dashed", "label": "top-k" },
              { "from": "ctx", "to": "llm", "kind": "solid",  "accent": "fire",  "label": "answer" }
            ]
          },
          {
            "type": "walkthrough",
            "title": "RAG: question → answer",
            "caption": "Walk one user question end-to-end through the retrieval pipeline.",
            "nodes": [
              { "id": "user",  "label": "User",     "subtitle": "QUESTION",   "accent": "sky",   "x": 0.08, "y": 0.5 },
              { "id": "orch",  "label": "Orch",     "subtitle": "PIPELINE",   "accent": "amber", "x": 0.32, "y": 0.5 },
              { "id": "emb",   "label": "Embedder", "subtitle": "ENCODE",     "accent": "water", "x": 0.55, "y": 0.20 },
              { "id": "vdb",   "label": "Vector DB","subtitle": "TOP-K",      "accent": "earth", "x": 0.55, "y": 0.80 },
              { "id": "llm",   "label": "LLM",      "subtitle": "GENERATE",   "accent": "fire",  "x": 0.92, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "User question arrives",
                "description": "User asks \"How do I rotate API keys?\" The orchestrator receives the raw text and starts the retrieval pipeline.",
                "activeNodes": ["user", "orch"],
                "activeEdges": [{ "from": "user", "to": "orch", "label": "ask" }]
              },
              {
                "title": "Embed query into a vector",
                "description": "Orchestrator hands the question to the embedding model (Voyage, Cohere, OpenAI…), which returns a ~1536-float vector that captures the question's meaning.",
                "activeNodes": ["orch", "emb"],
                "activeEdges": [{ "from": "orch", "to": "emb", "label": "encode" }]
              },
              {
                "title": "Vector DB returns top-k chunks",
                "description": "That query vector is sent to the vector DB. It runs approximate nearest-neighbor search (HNSW) over the document corpus and returns the top 3–8 closest chunks with their text and scores.",
                "activeNodes": ["emb", "vdb", "orch"],
                "activeEdges": [
                  { "from": "emb", "to": "vdb", "label": "search" },
                  { "from": "vdb", "to": "orch", "label": "top-k chunks" }
                ]
              },
              {
                "title": "Orchestrator stuffs chunks into the prompt",
                "description": "Orchestrator assembles the final prompt: a system message (\"answer using ONLY this context, cite [doc-N]\") plus the retrieved chunks plus the user's original question.",
                "activeNodes": ["orch", "llm"],
                "activeEdges": [{ "from": "orch", "to": "llm", "label": "context + question" }]
              },
              {
                "title": "LLM returns grounded answer with citations",
                "description": "LLM generates an answer constrained to the supplied context, inlining `[doc-N]` citations. The orchestrator forwards the response to the user — auditable, not hallucinated.",
                "activeNodes": ["llm", "user"],
                "activeEdges": [{ "from": "llm", "to": "user", "label": "answer + cites" }]
              }
            ]
          },
          {
            "type": "h3",
            "text": "Chunking is the whole game"
          },
          {
            "type": "p",
            "text": "**Bad chunks = bad retrieval = bad answers.** Too small and you lose context; too large and the embedding goes mushy. 200–800 tokens with ~10% overlap is the boring default that works."
          },
          {
            "type": "table",
            "headers": ["Strategy", "Best for", "Watch out"],
            "rows": [
              ["Fixed-size + overlap", "Generic text, fast to ship",    "Splits mid-sentence"],
              ["Paragraph / heading", "Markdown, structured docs",      "Uneven chunk sizes"],
              ["Semantic (embed-based)", "High-value corpora",          "Slow + expensive to build"],
              ["Code-aware (AST)",     "Source code retrieval",         "Language-specific"]
            ]
          },
          {
            "type": "h3",
            "text": "Retrieve, then prompt"
          },
          {
            "type": "p",
            "text": "**Top-k = 3 to 8 in production.** More chunks = more tokens = more cost, and past ~10 the model stops attending to the middle (the \"lost in the middle\" effect). Hybrid search (BM25 keyword + dense vector) beats pure-dense for proper nouns and IDs."
          },
          {
            "type": "p",
            "text": "**Cite or die.** Make the model quote the chunk ID in its answer (`[doc-37]`). Without citations you can't audit hallucinations, and your users can't verify the source."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic\n\nclient = Anthropic()\n\ndef rag_answer(query: str, retriever) -> str:\n    chunks = retriever.search(query, top_k=5)  # top-5 is the boring default\n    # build a context block the model can cite\n    context = \"\\n\\n\".join(f\"[doc-{c.id}] {c.text}\" for c in chunks)\n\n    resp = client.messages.create(\n        model=\"claude-sonnet-4-6\",\n        max_tokens=600,\n        temperature=0,  # grounded answers should be deterministic\n        system=\"Answer using ONLY the context. Cite [doc-N] inline. If unknown, say so.\",\n        messages=[{\n            \"role\": \"user\",\n            \"content\": f\"<context>\\n{context}\\n</context>\\n\\nQuestion: {query}\",\n        }],\n    )\n    return resp.content[0].text  # grounded, cited answer"
          },
          {
            "type": "pros-cons",
            "goodLabel": "RAG GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Private / fresh data — drop in new docs without retraining",
              "Auditable answers — citations let users verify",
              "Cost — small context beats stuffing the whole corpus"
            ],
            "watch": [
              "Context-stuffing anti-pattern — dumping 50 chunks tanks accuracy and bill",
              "Embedding-model mismatch — query and corpus must use the same encoder",
              "Stale index — when docs update, re-embed or you serve old answers"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Inspect a typical RAG retrieval result. Tweak k or the score threshold mentally.",
            "starter": "{\n  \"query\": \"How do I rotate API keys?\",\n  \"top_k\": 3,\n  \"hits\": [\n    {\n      \"doc_id\": \"sec-014\",\n      \"score\": 0.87,\n      \"chunk\": \"Rotate API keys quarterly via the Console > Security tab.\",\n      \"source\": \"runbooks/security.md#rotation\"\n    },\n    {\n      \"doc_id\": \"sec-022\",\n      \"score\": 0.81,\n      \"chunk\": \"After rotation, redeploy services that read the secret.\",\n      \"source\": \"runbooks/security.md#redeploy\"\n    },\n    {\n      \"doc_id\": \"sec-007\",\n      \"score\": 0.62,\n      \"chunk\": \"Keys are stored in AWS Secrets Manager, region us-east-1.\",\n      \"source\": \"runbooks/security.md#storage\"\n    }\n  ],\n  \"filtered_below_threshold\": 12\n}\n",
            "hint": "0.62 is borderline — many teams cut at 0.7. Lowering top_k or raising the threshold reduces tokens but risks missing answers."
          },
          {
            "type": "explain-back",
            "prompt": "In your own words: walk through what happens between a user typing a question and the LLM returning a cited answer in a RAG pipeline.",
            "modelAnswer": "Your question gets handed to an embedding model (Voyage, OpenAI, Cohere), which turns it into a ~1536-dim float vector capturing meaning. That vector goes to a vector DB, which does approximate nearest-neighbor search (HNSW) across your pre-embedded corpus and returns the top-k chunks — usually 3 to 8, because past ~10 the LLM stops attending to the middle of the context. The orchestrator stuffs those chunks into a prompt with a system message like *\"answer using ONLY this context, cite [doc-N] inline\"* plus your original question, and sends the bundle to the LLM. The model generates an answer grounded in the retrieved text with inline citations you can audit. The model never learned your data — it just got handed the right page right before being asked.",
            "hint": "Trace it as 5 steps: embed → search → top-k → stuff prompt → generate. What does each step take as input and produce as output?",
            "commit": {
              "q": "A user submits a question. What does the RAG pipeline do with it FIRST?",
              "opts": [
                "Search the vector DB for chunks containing the question's keywords",
                "Run the question through an embedding model to get a vector",
                "Stuff the question plus the whole corpus into the LLM's prompt"
              ],
              "answer": 1,
              "why": "The vector DB can only compare vectors, so the raw text has to become one before any search can happen. That ordering pins down the rest of the chain — now walk the remaining steps."
            }
          },
          {
            "type": "quote",
            "text": "Don't teach the model your data. Hand it the page it needs, then ask.",
            "cite": "the RAG mantra"
          }
        ]
      }
    ]
  },
  "mleng-embeddings": {
    "sections": [
      {
        "heading": "Embeddings and vector search",
        "body": [
          {
            "type": "p",
            "text": "**An embedding is a list of ~1500 floats that means something.** Similar meaning → nearby vectors. Vector search is just k-nearest-neighbor over those points. Everything else — the database, the index, the metric — is a knob on that one idea."
          },
          {
            "type": "diagram",
            "title": "Embedding + index lookup",
            "subtitle": "TEXT · VECTOR · INDEX · NEIGHBORS",
            "height": 220,
            "nodes": [
              { "id": "txt",   "label": "Text",       "subtitle": "doc",         "accent": "water", "x": 0.08, "y": 0.15 },
              { "id": "enc",   "label": "Encoder",    "subtitle": "embed model", "accent": "amber", "x": 0.34, "y": 0.38 },
              { "id": "vec",   "label": "Vector",     "subtitle": "1536 floats", "accent": "sky",   "x": 0.60, "y": 0.62 },
              { "id": "idx",   "label": "HNSW index", "subtitle": "approx kNN",  "accent": "earth", "x": 0.88, "y": 0.85 }
            ],
            "edges": [
              { "from": "txt", "to": "enc", "kind": "dashed", "label": "tokens" },
              { "from": "enc", "to": "vec", "kind": "solid",  "accent": "sky",   "label": "encode" },
              { "from": "vec", "to": "idx", "kind": "solid",  "accent": "earth", "label": "search" }
            ]
          },
          {
            "type": "h3",
            "text": "Distance: cosine, dot, Euclidean"
          },
          {
            "type": "p",
            "text": "**Cosine** is the default for text — measures angle, ignores magnitude. **Dot product** is faster when vectors are L2-normalized (then it equals cosine anyway). **Euclidean** rarely wins for semantic search but shows up in image embeddings."
          },
          {
            "type": "p",
            "text": "**Pin your metric to your model.** OpenAI's `text-embedding-3-*` are normalized → dot product is fine. Cohere v3 prefers cosine. Mixing metrics and models is how you ship silently broken retrieval."
          },
          {
            "type": "h3",
            "text": "Picking a vector DB"
          },
          {
            "type": "table",
            "headers": ["DB", "Best for", "Index", "Gotcha"],
            "rows": [
              ["pgvector",  "Already on Postgres",   "HNSW / IVF", "Slower past ~10M"],
              ["Chroma",    "Local dev, prototypes", "HNSW",       "Not for prod scale"],
              ["Weaviate",  "Hybrid + filters",      "HNSW",       "Ops-heavy self-host"],
              ["Pinecone",  "Managed, big scale",    "Proprietary","$$ at scale"]
            ]
          },
          {
            "type": "p",
            "text": "**HNSW vs IVF.** HNSW = graph-based, great recall, RAM-hungry. IVF = clustered, smaller memory, slower to build. HNSW wins for most read-heavy workloads under 50M vectors."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic  # we'll use Claude to answer over retrieved chunks\nimport numpy as np\n\nclient = Anthropic()\n\n# Pretend these came from your embedding model (Voyage, Cohere, OpenAI).\ndocs = {\n    \"d1\": (\"API keys rotate quarterly\",    np.array([0.10, 0.92, 0.05])),\n    \"d2\": (\"Logs are stored in S3\",         np.array([0.80, 0.10, 0.20])),\n    \"d3\": (\"Rotate creds via the console\",  np.array([0.12, 0.88, 0.07])),\n}\n\ndef cosine(a, b):  # angle-based similarity\n    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))\n\nq_vec = np.array([0.11, 0.90, 0.06])  # \"how do I rotate keys?\" — close to d1, d3\nranked = sorted(docs.items(), key=lambda kv: -cosine(q_vec, kv[1][1]))\ntop = ranked[:2]  # k=2 — keep the prompt small\ncontext = \"\\n\".join(f\"[{k}] {v[0]}\" for k, v in top)\n\nresp = client.messages.create(\n    model=\"claude-sonnet-4-6\",\n    max_tokens=200,\n    system=\"Answer using the context. Cite [doc-id].\",\n    messages=[{\"role\": \"user\", \"content\": f\"{context}\\n\\nHow do I rotate keys?\"}],\n)\nprint(resp.content[0].text)"
          },
          {
            "type": "pros-cons",
            "goodLabel": "EMBEDDINGS GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Semantic search beyond keyword match",
              "Clustering, dedup, recommendations — same vectors, different queries",
              "Multilingual retrieval with a single multilingual encoder"
            ],
            "watch": [
              "Re-embed when you change the model — old vectors are incomparable",
              "Pure-dense misses exact strings (SKUs, error codes) — add BM25",
              "Dimensionality cost — 3072-dim Pinecone bills add up fast"
            ]
          },
          {
            "type": "quote",
            "text": "Embeddings turn meaning into geometry. Search is just \"find me nearby points.\"",
            "cite": "the vector-search intuition"
          }
        ]
      }
    ]
  },
  "mleng-tool-use": {
    "sections": [
      {
        "heading": "Tool use and function calling",
        "body": [
          {
            "type": "p",
            "text": "**Tool use lets the LLM call your code.** You declare a JSON schema, the model picks a tool and fills the arguments, your code runs it, and the result goes back to the model. It's how an LLM becomes an agent instead of a chatbot."
          },
          {
            "type": "diagram",
            "title": "Agent loop",
            "subtitle": "USER · LLM · TOOL · RESULT · ANSWER",
            "height": 240,
            "nodes": [
              { "id": "user", "label": "User",       "subtitle": "question",  "accent": "water", "x": 0.30, "y": 0.30 },
              { "id": "llm",  "label": "LLM",        "subtitle": "claude",    "accent": "fire",  "x": 0.70, "y": 0.30 },
              { "id": "orch", "label": "Orchestrator","subtitle": "tool_use", "accent": "amber", "x": 0.30, "y": 0.75 },
              { "id": "tool", "label": "Tool",       "subtitle": "function",  "accent": "earth", "x": 0.70, "y": 0.75 }
            ],
            "edges": [
              { "from": "user", "to": "llm",  "kind": "dashed", "label": "ask" },
              { "from": "llm",  "to": "orch", "kind": "solid",  "accent": "amber", "label": "tool_use" },
              { "from": "orch", "to": "tool", "kind": "dashed", "accent": "earth", "label": "invoke" },
              { "from": "tool", "to": "llm",  "kind": "solid",  "accent": "fire",  "label": "result", "curve": 0.4 }
            ]
          },
          {
            "type": "h3",
            "text": "The schema is the contract"
          },
          {
            "type": "p",
            "text": "**A tool definition is just JSON schema** — name, description, input shape. The description is the most important field; the model decides whether to use the tool based almost entirely on what you wrote there."
          },
          {
            "type": "table",
            "headers": ["Field", "Purpose", "Rule of thumb"],
            "rows": [
              ["name",        "Stable ID for the tool",        "snake_case, verb-led"],
              ["description", "When + why to call it",         "One sentence, present tense"],
              ["input_schema","Argument shape (JSON Schema)",  "Required fields, strict types"],
              ["result",      "What you send back",            "Short string or small JSON"]
            ]
          },
          {
            "type": "h3",
            "text": "The agent loop"
          },
          {
            "type": "p",
            "text": "**Loop until `stop_reason != tool_use`.** Model decides → orchestrator runs the tool → result feeds back → model decides again. Cap iterations (5–8) so a confused model can't burn your budget chasing its tail."
          },
          {
            "type": "p",
            "text": "**Errors are inputs too.** If the tool raises, send the error back as the tool result. Models recover surprisingly well — \"that file didn't exist, try a different path\" is exactly the feedback they can act on."
          },
          {
            "type": "p",
            "text": "**Declare the tool schema and the dispatcher.** The description is what the model actually reads when deciding whether to call it."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic\n\nclient = Anthropic()\n\ntools = [{\n    \"name\": \"get_weather\",  # snake_case, verb-led\n    \"description\": \"Get the current temperature for a city.\",  # the model reads THIS\n    \"input_schema\": {\n        \"type\": \"object\",\n        \"properties\": {\"city\": {\"type\": \"string\"}},\n        \"required\": [\"city\"],  # missing field => model gets a validation error\n    },\n}]\n\ndef run_tool(name: str, args: dict) -> str:\n    if name == \"get_weather\":\n        return f\"{args['city']}: 22C, clear\"  # toy implementation\n    return f\"error: unknown tool {name}\"  # surface errors back to the model"
          },
          {
            "type": "p",
            "text": "**The agent loop** — call the model, run any requested tool, feed the result back. Cap the iterations so a confused model can't burn the budget chasing its tail."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "messages = [{\"role\": \"user\", \"content\": \"Weather in Tokyo?\"}]\nfor _ in range(5):  # cap the loop — runaway agents are expensive\n    resp = client.messages.create(\n        model=\"claude-sonnet-4-6\", max_tokens=400, tools=tools, messages=messages,\n    )\n    messages.append({\"role\": \"assistant\", \"content\": resp.content})\n    if resp.stop_reason != \"tool_use\":\n        break  # final answer reached\n    # find tool_use block, run it, append the result\n    tu = next(b for b in resp.content if b.type == \"tool_use\")\n    result = run_tool(tu.name, tu.input)\n    messages.append({\"role\": \"user\", \"content\": [\n        {\"type\": \"tool_result\", \"tool_use_id\": tu.id, \"content\": result},\n    ]})\nprint(resp.content[-1].text)  # final natural-language answer"
          },
          {
            "type": "pros-cons",
            "goodLabel": "TOOL USE GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Calculator, web search, DB queries — anything the model can't do natively",
              "Strongly-typed outputs via schema — no regex parsing prose",
              "Composable — same tool reused across many agents"
            ],
            "watch": [
              "Unbounded loops — always cap iterations and total tokens",
              "Side-effecting tools (DELETE, send_email) — require a confirm step",
              "Vague descriptions — the model picks the wrong tool or skips it"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "A tool-schema is just JSON. Tweak the description or add a required field.",
            "starter": "{\n  \"name\": \"search_orders\",\n  \"description\": \"Look up a customer's order by order_id or email. Use when the user mentions an order, refund, or shipping question.\",\n  \"input_schema\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"order_id\": { \"type\": \"string\", \"description\": \"e.g. ORD-12345\" },\n      \"email\":    { \"type\": \"string\", \"format\": \"email\" }\n    },\n    \"anyOf\": [\n      { \"required\": [\"order_id\"] },\n      { \"required\": [\"email\"] }\n    ]\n  }\n}\n",
            "hint": "Sharpen the description so the model knows EXACTLY when to call it. Vague descriptions = wrong-tool picks."
          },
          {
            "type": "quote",
            "text": "A tool's description is its job interview. Write it like you're hiring.",
            "cite": "the tool-schema rule"
          },
          {
            "type": "explain-back",
            "prompt": "You've seen the three pieces that turn an LLM into an agent: the **tool schema** (the contract the model reads), the **agent loop** (call → run tool → feed result back, repeat until `stop_reason != tool_use`), and **errors-as-inputs** (handing failures back so the model recovers). Design a customer-support agent that can look up orders **and** issue refunds. Explain how the three pieces fit together end-to-end, and name the trade-off you'd watch when one of those tools has a side effect.",
            "modelAnswer": "Start with the **schemas** as contracts: `search_orders` is a safe read, and its description tells the model exactly when to call it; `issue_refund` is a write, with a strict `input_schema` (order_id, amount) so the model can't fill garbage. The **agent loop** drives execution — call the model, and while `stop_reason == tool_use`, pull the requested tool block, dispatch it, append the `tool_result`, and loop again until the model stops asking for tools and emits the final answer. Cap iterations at ~5-8 so a confused model can't burn the budget chasing its tail. **Errors are just more input**: if `search_orders` raises \"no order found,\" send that string back as the tool result and the model re-asks for an email instead of crashing. **The trade-off I'd watch is autonomy vs. safety on the side-effecting tool**: `search_orders` is idempotent and safe to let the loop call freely, but `issue_refund` moves money, so I'd gate it behind a human-confirm step (or a hard policy cap, like the lesson's refuse-over-$500 rule) before executing. Letting the agent call a write tool with the same freedom as a read tool is how an unbounded loop turns one confused turn into a pile of duplicate refunds.",
            "hint": "Walk one request through schema → loop → result, then split your tools into reads vs. writes. Which one is safe to auto-call, and what guard does the other one need?",
            "commit": {
              "q": "Your agent has `search_orders` and `issue_refund`. Which call needs a guard before the loop executes it?",
              "opts": [
                "`issue_refund` — its side effect can't be undone by looping again",
                "`search_orders` — reads fire more often, so they burn more budget",
                "Both equally — every tool call should wait on a human confirmation"
              ],
              "answer": 0,
              "why": "Reads are safe to retry; a write that moves money is not — and the loop happily repeats calls, which is exactly the danger for a non-idempotent tool. Now fit the schema and errors-as-inputs pieces around that."
            }
          }
        ]
      }
    ]
  },
  "mleng-llm-eval": {
    "sections": [
      {
        "heading": "Evaluating LLM systems",
        "body": [
          {
            "type": "p",
            "text": "**You can't ship what you can't measure.** LLM eval is harder than classification eval — outputs are open-ended, judges disagree, and BLEU was never the answer. The teams that win build a small golden set, an LLM judge, and a regression dashboard before they ship v2."
          },
          {
            "type": "diagram",
            "title": "Eval pipeline",
            "subtitle": "GOLDEN · CANDIDATE · JUDGE · DASHBOARD",
            "height": 220,
            "nodes": [
              { "id": "golden", "label": "Golden set",  "subtitle": "100 cases", "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "cand",   "label": "Candidate",   "subtitle": "new prompt","accent": "fire",  "x": 0.34, "y": 0.5 },
              { "id": "judge",  "label": "LLM judge",   "subtitle": "claude",    "accent": "amber", "x": 0.60, "y": 0.85 },
              { "id": "dash",   "label": "Trace store", "subtitle": "LangSmith", "accent": "earth", "x": 0.86, "y": 0.85 }
            ],
            "edges": [
              { "from": "golden", "to": "cand",  "kind": "dashed", "label": "run" },
              { "from": "cand",   "to": "judge", "kind": "solid",  "accent": "amber", "label": "score" },
              { "from": "judge",  "to": "dash",  "kind": "dashed", "accent": "earth", "label": "log" }
            ]
          },
          {
            "type": "h3",
            "text": "Pick the right metric"
          },
          {
            "type": "table",
            "headers": ["Metric", "Use for", "Watch out"],
            "rows": [
              ["Task pass/fail",       "Code, math, extraction",   "Needs unit tests per case"],
              ["Pairwise preference",  "Style, helpfulness",        "Order bias — randomize"],
              ["LLM-as-judge (rubric)","Open-ended quality",        "Judge has its own biases"],
              ["Human eval",           "High-stakes, final gate",   "Slow + $$$"]
            ]
          },
          {
            "type": "p",
            "text": "**BLEU and ROUGE are dead** for LLM output. They measure surface overlap, which has almost nothing to do with whether the answer is correct or useful. Use them only when you're literally translating with a reference text."
          },
          {
            "type": "h3",
            "text": "Golden sets and regression"
          },
          {
            "type": "p",
            "text": "**Start with 50–100 cases.** Pick the hardest ones, the ambiguous ones, and the ones that broke last quarter. Re-run on every prompt change. \"Better on average\" means nothing if you silently broke 10% of users."
          },
          {
            "type": "p",
            "text": "**Trace everything in dev too.** LangSmith, Helicone, Langfuse — same idea, different vendors. You want input, output, latency, tokens, and the full prompt logged per call, searchable by tag. Without traces you debug with print()."
          },
          {
            "type": "p",
            "text": "**The judge** — a stronger model than the one under test, prompted with a strict rubric and `temperature=0` for reproducibility."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from anthropic import Anthropic\n\nclient = Anthropic()\n\nJUDGE_RUBRIC = (\n    \"Score the answer on a 1-5 scale. 5 = correct and concise. \"\n    \"Return JSON: {score, reason}. No prose.\"\n)\n\ndef llm_judge(question: str, answer: str, gold: str) -> dict:\n    # Use a stronger model as the judge than the one being evaluated.\n    resp = client.messages.create(\n        model=\"claude-opus-4-8\",  # judge > candidate, by design\n        max_tokens=200,\n        temperature=0,  # reproducible scores\n        system=JUDGE_RUBRIC,\n        messages=[{\n            \"role\": \"user\",\n            \"content\": (\n                f\"Question: {question}\\n\"\n                f\"Gold: {gold}\\n\"\n                f\"Candidate: {answer}\"\n            ),\n        }],\n    )\n    return resp.content[0].text  # parse to {score, reason}"
          },
          {
            "type": "p",
            "text": "**The loop** — run the candidate on every golden case, judge each, aggregate. A drop on any case is more interesting than the average."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# typical eval loop: run candidate over golden set, judge each, aggregate\nscores = [llm_judge(c.q, candidate_answer(c), c.gold) for c in golden_set]"
          },
          {
            "type": "pros-cons",
            "goodLabel": "LLM-AS-JUDGE GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Cheap, scalable scoring over 1000s of cases",
              "Catches obvious regressions before users do",
              "Rubric-based — you can tune what 'good' means"
            ],
            "watch": [
              "Judge bias — prefers verbose, prefers its own family of model",
              "Pairwise position bias — A-vs-B and B-vs-A disagree; always run both",
              "LLM judge is not a human — for high-stakes, hold a human-eval gate"
            ]
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Sketch a tiny golden-set runner — see how scores aggregate.",
            "varName": "response",
            "starter": "# Stand-in eval — no real API calls.\ngolden = [\n    {\"q\": \"2+2?\",          \"gold\": \"4\"},\n    {\"q\": \"capital of FR\", \"gold\": \"Paris\"},\n    {\"q\": \"sqrt(81)\",      \"gold\": \"9\"},\n]\n\ndef candidate(q):  # pretend this calls claude-sonnet-4-6\n    answers = {\"2+2?\": \"4\", \"capital of FR\": \"Paris\", \"sqrt(81)\": \"nine\"}\n    return answers.get(q, \"\")\n\ndef judge(answer, gold):  # toy exact-match judge\n    return 1.0 if answer.strip().lower() == gold.lower() else 0.0\n\nresults = [{\"q\": c[\"q\"], \"score\": judge(candidate(c[\"q\"]), c[\"gold\"])} for c in golden]\npass_rate = sum(r[\"score\"] for r in results) / len(results)\n\nresponse = {\n    \"pass_rate\": pass_rate,  # 2/3 in this toy run — \"nine\" != \"9\"\n    \"results\": results,\n    \"regressed\": [r for r in results if r[\"score\"] < 1.0],\n}\nprint(response)\n",
            "hint": "Notice the third case fails: 'nine' vs '9'. Real eval needs a smarter judge OR normalized gold answers."
          },
          {
            "type": "quote",
            "text": "Ship the eval before you ship the feature. The model changes weekly — your golden set is the bedrock.",
            "cite": "the LLM-eval rule"
          }
        ]
      }
    ]
  },
  "mleng-cap-rag": {
    "sections": [
      {
        "heading": "What you're **shipping**",
        "body": [
          {
            "type": "p",
            "text": "A working RAG app on your own machine: you point it at a folder of your notes, it **chunks** them, **embeds** every chunk, stores the vectors, and answers questions with an LLM — *citing which file the answer came from*. Two Python files, ~70 lines total. Every line typed by you, in **your** VS Code."
          },
          {
            "type": "diagram",
            "title": "The pipeline you're building",
            "height": 250,
            "caption": "Ingest runs once per docs change. Ask runs per question. The vector store is the handoff point between them.",
            "nodes": [
              {
                "id": "docs",
                "label": "docs/",
                "subtitle": "your .md + .txt",
                "accent": "water",
                "x": 0.12,
                "y": 0.26
              },
              {
                "id": "chunk",
                "label": "chunk",
                "subtitle": "~800 chars",
                "accent": "sky",
                "x": 0.5,
                "y": 0.26
              },
              {
                "id": "embed",
                "label": "embed",
                "subtitle": "MiniLM · 384-d",
                "accent": "sky",
                "x": 0.88,
                "y": 0.26
              },
              {
                "id": "store",
                "label": "Chroma",
                "subtitle": "vector store",
                "accent": "earth",
                "x": 0.88,
                "y": 0.76
              },
              {
                "id": "retrieve",
                "label": "retrieve",
                "subtitle": "top-k cosine",
                "accent": "amber",
                "x": 0.5,
                "y": 0.76
              },
              {
                "id": "llm",
                "label": "Claude",
                "subtitle": "grounded answer",
                "accent": "fire",
                "x": 0.12,
                "y": 0.76
              }
            ],
            "edges": [
              {
                "from": "docs",
                "to": "chunk",
                "kind": "solid",
                "label": "read"
              },
              {
                "from": "chunk",
                "to": "embed",
                "kind": "solid",
                "label": "text"
              },
              {
                "from": "embed",
                "to": "store",
                "kind": "solid",
                "label": "vectors"
              },
              {
                "from": "store",
                "to": "retrieve",
                "kind": "solid",
                "label": "top-4"
              },
              {
                "from": "retrieve",
                "to": "llm",
                "kind": "dashed",
                "label": "context"
              }
            ]
          },
          {
            "type": "ul",
            "items": [
              "`ingest.py` — load → chunk → embed → store. Run it whenever your docs change.",
              "`ask.py` — embed the question → retrieve top-4 chunks → one **grounded** LLM call → answer with citations.",
              "A grounding rule that makes the app say **\"I don't know\"** instead of inventing answers."
            ]
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Chunk",
                "def": "A slice of a document small enough to embed as *one idea*. Chunk size is the biggest quality dial in RAG."
              },
              {
                "term": "Embedding",
                "def": "A vector where *similar meaning → nearby points*. We use a local model — free, offline, no API key."
              },
              {
                "term": "Vector store",
                "def": "A database indexed by vector similarity instead of exact keys. Chroma runs embedded in your process."
              },
              {
                "term": "Grounding",
                "def": "Forcing the LLM to answer only from retrieved context — the difference between RAG and vibes."
              }
            ]
          }
        ]
      },
      {
        "heading": "Setup — one terminal, three installs",
        "body": [
          {
            "type": "p",
            "text": "You need Python 3.10+ and an Anthropic API key (create one at `console.anthropic.com` → API keys). Embeddings run **locally** — the key is only for the final answer call, and this whole capstone costs a few cents."
          },
          {
            "type": "build-along",
            "title": "Project skeleton + dependencies",
            "goal": "An isolated venv with the three libraries, your API key in the environment, and a docs/ folder with something to read. Click through, then run it for real.",
            "lang": "bash",
            "file": "terminal",
            "steps": [
              {
                "title": "Make the project and the venv",
                "say": "A fresh venv per project keeps sentence-transformers' heavy deps (torch) out of your global Python. On Windows the activate path is .venv\\Scripts\\activate instead of the source line.",
                "add": "mkdir rag-capstone && cd rag-capstone\npython -m venv .venv  # isolate deps — torch is heavy, keep it out of global site-packages\nsource .venv/bin/activate  # Windows: .venv\\Scripts\\activate"
              },
              {
                "title": "Install the three moving parts",
                "say": "One library per pipeline stage: anthropic for the LLM call, chromadb for the vector store, sentence-transformers for local embeddings. First install pulls torch — give it a minute.",
                "add": "pip install anthropic chromadb sentence-transformers  # LLM client · vector store · local embeddings"
              },
              {
                "title": "Put the API key in the environment",
                "say": "The SDK reads ANTHROPIC_API_KEY automatically — never paste a key into code, and never commit one. On Windows PowerShell it's $env:ANTHROPIC_API_KEY = \"sk-ant-...\".",
                "add": "export ANTHROPIC_API_KEY=\"sk-ant-...\"  # from console.anthropic.com — env var, never hardcoded"
              },
              {
                "title": "Give it something to read",
                "say": "Real docs make this project stick — drop in lecture notes, READMEs, essays. The printf gives you a guaranteed-working starter file either way.",
                "add": "mkdir docs  # drop 3-5 of your own .txt / .md files in here\nprintf 'Gradient checkpointing trades compute for memory.\\nIt recomputes activations during backprop instead of storing them all.\\n\\nMixed precision keeps fp32 master weights but runs matmuls in fp16.\\n' > docs/ml-notes.txt  # starter doc so the pipeline has input on day one"
              }
            ]
          }
        ]
      },
      {
        "heading": "Build `ingest.py` — chunk, embed, store",
        "body": [
          {
            "type": "p",
            "text": "Ingest is the *write path*. Design choice #1: **paragraph-aware chunking** at ~800 characters. Fixed-size slicing chops sentences in half and the embedding of half a thought points nowhere useful. Splitting on blank lines keeps each chunk one coherent idea."
          },
          {
            "type": "build-along",
            "title": "ingest.py — the write path, five pieces",
            "goal": "Load every text file in docs/, chunk on paragraph boundaries, embed each chunk with a local model, and write vectors + text + source metadata into a persistent Chroma collection.",
            "lang": "python",
            "file": "ingest.py",
            "steps": [
              {
                "title": "Load the docs",
                "say": "A generator that yields (filename, text) pairs. The filename rides along the whole pipeline — it's what makes citations possible at the end.",
                "add": "from pathlib import Path\n\ndef load_docs(folder=\"docs\"):\n    exts = {\".txt\", \".md\"}  # plain text only — PDFs need a parser, keep v0 simple\n    for path in sorted(Path(folder).iterdir()):\n        if path.suffix in exts:\n            yield path.name, path.read_text(encoding=\"utf-8\")  # the name becomes the citation source"
              },
              {
                "title": "Chunk on paragraph boundaries",
                "say": "Accumulate paragraphs into a buffer; flush when adding the next one would blow the budget. Chunks end on blank lines, so no thought gets cut mid-sentence. 800 chars ≈ 150-200 tokens — small enough to be one idea, big enough to carry context.",
                "add": "\ndef chunk(text, max_chars=800):\n    parts, buf = [], \"\"\n    for para in text.split(\"\\n\\n\"):  # split on blank lines — paragraphs stay whole\n        if buf and len(buf) + len(para) > max_chars:  # next para would overflow — flush first\n            parts.append(buf.strip())\n            buf = \"\"\n        buf += para + \"\\n\\n\"\n    if buf.strip():  # gotcha: don't drop the final partial chunk\n        parts.append(buf.strip())\n    return parts"
              },
              {
                "title": "Load the embedding model",
                "say": "all-MiniLM-L6-v2 is the workhorse: 384 dimensions, fast on CPU, ~80MB one-time download. It runs entirely on your machine — embedding a thousand chunks costs nothing.",
                "add": "\nfrom sentence_transformers import SentenceTransformer  # local model — no API key, no per-call cost\n\nembedder = SentenceTransformer(\"all-MiniLM-L6-v2\")  # 384-dim vectors, ~80MB download on first run"
              },
              {
                "title": "Open the vector store",
                "say": "PersistentClient writes to ./store on disk, so ask.py can read the index later without re-ingesting. The cosine setting must match how we normalize the vectors — mismatched metric and model is the classic silent RAG bug.",
                "add": "\nimport chromadb  # embedded vector store — runs inside your process\n\nstore = chromadb.PersistentClient(path=\"store\")  # ./store persists across runs\ncol = store.get_or_create_collection(\n    \"notes\",\n    metadata={\"hnsw:space\": \"cosine\"},  # cosine to match normalized MiniLM vectors — mismatch = silently broken retrieval\n)"
              },
              {
                "title": "Wire the main loop",
                "say": "Chunk, embed in one batch, and write everything Chroma needs: stable ids (so re-running upserts instead of duplicating), the raw text (retrieval hands it straight to the prompt), and the source filename for citations.",
                "add": "\nif __name__ == \"__main__\":\n    for name, text in load_docs():\n        chunks = chunk(text)\n        vecs = embedder.encode(chunks, normalize_embeddings=True)  # unit length → cosine = dot product\n        col.add(\n            ids=[f\"{name}-{i}\" for i in range(len(chunks))],  # stable ids — re-ingesting overwrites, no dupes\n            embeddings=vecs.tolist(),  # chroma wants plain lists, not numpy arrays\n            documents=chunks,  # store the text too — retrieval returns it ready for the prompt\n            metadatas=[{\"source\": name} for _ in chunks],  # the citation trail\n        )\n        print(f\"{name}: {len(chunks)} chunks\")"
              }
            ]
          },
          {
            "type": "p",
            "text": "Run it. First run downloads the embedding model, then you should see one line per file:"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "python ingest.py\n# ml-notes.txt: 2 chunks  ← one line per doc; a store/ folder appears next to it"
          }
        ]
      },
      {
        "heading": "Build `ask.py` — retrieve + **grounded** answer",
        "body": [
          {
            "type": "p",
            "text": "Ask is the *read path*: embed the question **with the same model**, pull the 4 nearest chunks, and hand them to the LLM with strict instructions. The system prompt is doing real engineering work here — it's what turns \"an LLM with some pasted text\" into a system that refuses to make things up."
          },
          {
            "type": "build-along",
            "title": "ask.py — the read path, five pieces",
            "goal": "Take a question from the command line, retrieve the most relevant chunks from the store, and get a cited, grounded answer — or an honest \"I don't know\".",
            "lang": "python",
            "file": "ask.py",
            "steps": [
              {
                "title": "Wire up the three clients",
                "say": "Same embedding model as ingest — this is non-negotiable. Vectors from different models live in different spaces; mixing them gives similarity scores that are pure noise, with no error message.",
                "add": "import sys\nimport chromadb\nfrom sentence_transformers import SentenceTransformer\nfrom anthropic import Anthropic\n\nembedder = SentenceTransformer(\"all-MiniLM-L6-v2\")  # MUST match ingest — mixed models = meaningless similarity\nstore = chromadb.PersistentClient(path=\"store\").get_collection(\"notes\")  # raises if ingest.py never ran\nllm = Anthropic()  # reads ANTHROPIC_API_KEY from the environment"
              },
              {
                "title": "Embed the question, query the store",
                "say": "The question goes through the exact same encode call as the chunks did — same model, same normalization. n_results=4 is a starting dial: too low misses context, too high stuffs the prompt with noise.",
                "add": "\nquestion = \" \".join(sys.argv[1:]) or \"What do my notes say about memory?\"  # CLI arg, with a fallback\nqvec = embedder.encode([question], normalize_embeddings=True).tolist()  # same model + normalization as ingest\nhits = store.query(query_embeddings=qvec, n_results=4)  # top-4 nearest chunks — k is a dial, not a truth"
              },
              {
                "title": "Assemble the context block",
                "say": "Each chunk gets its [source] tag stitched on so the model can cite files by name. The [0] indexing is a chroma quirk: it returns one result list per query, and we sent one query.",
                "add": "\ncontext = \"\\n\\n---\\n\\n\".join(\n    f\"[{meta['source']}]\\n{doc}\"  # prefix each chunk with its source — enables citations\n    for doc, meta in zip(hits[\"documents\"][0], hits[\"metadatas\"][0])  # [0]: chroma returns one list per query\n)"
              },
              {
                "title": "Write the grounding rules",
                "say": "Three rules, each load-bearing: only the context (blocks outside knowledge), cite sources (makes answers checkable), admit ignorance (the anti-hallucination escape hatch). Delete any one and watch quality drop.",
                "add": "\nSYSTEM = (\n    \"Answer using ONLY the provided context. \"  # rule 1 — no outside knowledge allowed\n    \"Cite the [source] tags you used. \"  # rule 2 — every claim traceable to a file\n    \"If the context does not contain the answer, say you don't know.\"  # rule 3 — the escape hatch beats a guess\n)"
              },
              {
                "title": "Make the LLM call",
                "say": "Context first, question last — models weight the end of the prompt heavily, so the question lands closest to the answer. Run it: python ask.py \"what does gradient checkpointing trade?\"",
                "add": "\nresp = llm.messages.create(\n    model=\"claude-opus-4-8\",  # current model id — one string to change when models move\n    max_tokens=1024,  # grounded answers are short — cap the spend\n    system=SYSTEM,\n    messages=[{\n        \"role\": \"user\",\n        \"content\": f\"<context>\\n{context}\\n</context>\\n\\nQuestion: {question}\",  # context first, question last\n    }],\n)\nprint(resp.content[0].text)  # first content block carries the answer text"
              }
            ]
          }
        ]
      },
      {
        "heading": "Verify: prove it's **grounded**, not lucky",
        "body": [
          {
            "type": "p",
            "text": "\"It printed an answer\" is not verification. Run these three tests — each one checks a different part of the pipeline:"
          },
          {
            "type": "ol",
            "items": [
              "**The base case.** Ask something a single doc clearly answers: `python ask.py \"what does gradient checkpointing trade?\"` — the answer should be right *and* cite `[ml-notes.txt]`.",
              "**The refusal test.** Ask something your docs *cannot* answer: `python ask.py \"who won the 1998 World Cup?\"` — a grounded app says **\"I don't know\"**. If it answers confidently, your system prompt isn't holding.",
              "**The k experiment.** Change `n_results` from 4 to 1, re-ask a question whose answer spans two paragraphs, and watch the answer degrade. Now you *feel* why k is a dial."
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "WHAT V0 DOES WELL",
            "watchLabel": "WHAT V0 PUNTS ON",
            "good": [
              "The whole RAG pattern, end to end, with no framework magic hiding the moving parts",
              "Citations — every answer traces back to a file you can open",
              "Honest refusals on out-of-scope questions",
              "Each stage is swappable: bigger embedder, different store, different LLM — one file each"
            ],
            "watch": [
              "Paragraph chunking still splits long sections awkwardly — no overlap between chunks",
              "Pure vector search misses exact-match terms (error codes, product names)",
              "No eval — you're eyeballing quality, and eyeballs don't scale (that's the next capstone)",
              "Single-turn only — no conversation memory"
            ]
          },
          {
            "type": "explain-back",
            "prompt": "Synthesis. Trace one question end-to-end through your app — every transformation from `sys.argv` to the printed answer. Along the way: why must ingest and ask use the **same embedding model**, and what specifically does each of the three grounding rules buy you?",
            "modelAnswer": "The question comes in as text and is **embedded** by all-MiniLM-L6-v2 into a normalized 384-dim vector — the same model and the same normalization used at ingest, because retrieval is a nearest-neighbor search *in the embedding model's space*: two different models put the same sentence at unrelated coordinates, so a query embedded by model B against chunks embedded by model A returns confident-looking nonsense with no error. Chroma runs a **cosine top-4** search over the stored chunk vectors and returns the chunk *texts* plus their source metadata — this is why ingest stored the raw text and filename alongside each vector. The chunks are stitched into a context block, each prefixed with its `[source]` tag, and sent as one LLM call: context first, question last. The **system prompt** carries three separate guarantees: \"only the provided context\" blocks the model's parametric knowledge from leaking in (otherwise you can't tell if the answer came from your docs); \"cite the [source] tags\" makes every answer auditable — you can open the file and check; \"say you don't know\" converts the failure mode from *confident fabrication* to *honest refusal*, which is the difference users actually care about. The printed answer is only trustworthy because every hop — same embedding space, text carried with vectors, grounding rules — held.",
            "hint": "Follow the data: question → vector → top-4 chunks → context block → grounded call. Then ask what breaks if the models differ, and what each system-prompt rule prevents.",
            "commit": {
              "q": "Your RAG app answers a question that is NOT in your docs with a confident, made-up paragraph. Which change most directly fixes it?",
              "opts": [
                "Swap in a bigger LLM — larger models hallucinate less",
                "Tighten the system prompt: answer ONLY from context, and say \"I don't know\" when it isn't there",
                "Raise n_results so more chunks come back with every query"
              ],
              "answer": 1,
              "why": "Hallucination on out-of-scope questions is a grounding failure, not a model-size or retrieval-quantity problem. More chunks of irrelevant context can make it worse. The explicit only-from-context + refusal instruction is the lever that changes the failure mode."
            }
          }
        ]
      },
      {
        "heading": "Ship it — stretch goals",
        "body": [
          {
            "type": "p",
            "text": "The core loop works. Each stretch below is a real upgrade production RAG systems make — pick one and ship it:"
          },
          {
            "type": "ul",
            "items": [
              "**Chunk overlap** — repeat the last ~100 chars of each chunk at the start of the next, so ideas that straddle a boundary survive. Measure the difference on your k experiment.",
              "**Better citations** — store a heading or line-range in metadata, not just the filename, and make answers cite `[ml-notes.txt § mixed precision]`.",
              "**Streaming answers** — swap `messages.create` for `messages.stream` and print tokens as they arrive. Same call shape, much better feel.",
              "**Hybrid retrieval** — add a plain keyword pass (even `str.contains` over chunks) and merge results with the vector hits. Watch exact-match queries (error codes!) start working.",
              "**Serve it** — wrap `ask.py` in a FastAPI `POST /ask` endpoint. Congratulations: you've built the backbone of every \"chat with your docs\" product.",
              "**Then build the eval harness** — the next capstone. \"It seems better\" stops being an acceptable sentence."
            ]
          },
          {
            "type": "quote",
            "text": "RAG is four cheap parts and one expensive lesson: the system prompt is part of the architecture.",
            "cite": "every team after their first hallucination incident"
          }
        ]
      }
    ]
  },
  "mleng-cap-evals": {
    "sections": [
      {
        "heading": "The brief — no steps this time",
        "body": [
          {
            "type": "p",
            "text": "Your RAG app answers questions. Is it *good*? Right now you genuinely don't know — you've been eyeballing outputs, and eyeballs can't tell you whether yesterday's chunk-size change made things better or quietly broke three answers."
          },
          {
            "type": "p",
            "text": "**Your mission:** build `eval.py` — an evaluation harness for the RAG app from the last capstone. This is a *build-it-yourself* project: you get requirements, success criteria, and hints. The step-by-step is on you. Budget ~60 minutes of real VS Code time."
          },
          {
            "type": "p",
            "text": "The core idea: **layer the metrics**. Retrieval is measured *without* the LLM (deterministic, free, instant). Answer quality is measured *with* an LLM judge (slower, costs cents, catches what string-matching can't). When quality drops, the layer that moved tells you where to look."
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ol",
            "items": [
              "**A golden set** — `golden.jsonl`, at least **12 questions**, each line holding: the question, a one-sentence golden answer, and the source file (or chunk id) that should be retrieved. Composition below.",
              "**Retrieval metrics, LLM-free** — for every golden question: is the expected source in the top-k results (**hit-rate@k**), and at what rank (**MRR**)? These must run without a single LLM call.",
              "**Answer grading, LLM-as-judge** — call your app for each question, then have a judge model compare the app's answer against the *golden* answer. The judge returns strict JSON: a verdict (`correct` / `partial` / `wrong`) and one sentence of reasoning.",
              "**The refusal check** — the not-in-docs questions must produce \"I don't know\". A fluent, confident, *wrong* answer scores zero — that's the exact failure RAG exists to prevent.",
              "**One command, one artifact** — `python eval.py` prints a scoreboard and appends one JSON line to `runs.jsonl` (timestamp, k, hit-rate, MRR, judge tallies). Two runs in that file = your first regression test."
            ]
          },
          {
            "type": "table",
            "headers": [
              "Question type",
              "How many",
              "Why it's in the set"
            ],
            "align": [
              "left",
              "center",
              "left"
            ],
            "rows": [
              [
                "**Answerable** — one chunk holds it",
                "6",
                "The base case: retrieval and grounding both have to work"
              ],
              [
                "**Multi-chunk** — spans 2+ chunks",
                "3",
                "Stresses your `k` and chunking choices"
              ],
              [
                "**Not in docs** — unanswerable",
                "3",
                "Grounding under pressure — must produce a refusal"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "table",
            "headers": [
              "Check",
              "Done means"
            ],
            "align": [
              "left",
              "left"
            ],
            "rows": [
              [
                "Golden set",
                "12+ questions in the 6/3/3 mix, each with a golden answer and an expected source"
              ],
              [
                "Retrieval",
                "Hit-rate@4 and MRR print every run — and you can explain any miss by opening the doc"
              ],
              [
                "Judge",
                "Verdicts are parsed as strict JSON; a parse failure counts as an **error**, never a pass"
              ],
              [
                "Refusals",
                "All 3 not-in-docs questions score as refusals; a confident answer there scores 0"
              ],
              [
                "Regression",
                "Two consecutive runs sit in `runs.jsonl` and you can say which was better, per layer"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Prove it end-to-end: run the eval, change `n_results` from 4 to 2 in your app, run it again, and point at which numbers moved — and *which layer* they moved in."
          }
        ]
      },
      {
        "heading": "Hints — open one at a time, only when stuck",
        "body": [
          {
            "type": "h4",
            "text": "Golden set"
          },
          {
            "type": "ul",
            "items": [
              "Write questions by *opening a doc and picking a fact* — never from memory. If you can't point at the sentence that answers it, the question doesn't belong in the set.",
              "Keep golden answers to one sentence. The judge compares against them — long golden answers make every real answer look \"partial\"."
            ]
          },
          {
            "type": "h4",
            "text": "The judge"
          },
          {
            "type": "ul",
            "items": [
              "Give the judge the **golden answer**. Comparing two texts is a task LLMs do reliably; judging truth from scratch is not. That's the whole trick of golden-set judging.",
              "Force the output shape: *\"Respond with ONLY a JSON object: {\\\"verdict\\\": \\\"correct|partial|wrong\\\", \\\"reason\\\": \\\"...\\\"}\"* — then `json.loads` inside a `try`. Treat a parse failure as an eval error, not a verdict.",
              "The judge can be a smaller, cheaper model than the one being judged — grading against a reference is much easier than generating.",
              "Judges drift lenient. Pin the rubric in the prompt: *\"partial = right direction but missing a key fact; wrong = contradicts or misses the golden answer\"*."
            ]
          },
          {
            "type": "h4",
            "text": "Metrics"
          },
          {
            "type": "ul",
            "items": [
              "Hit-rate@k = fraction of questions whose expected source appears anywhere in the top k results.",
              "MRR = mean of 1/rank of the first relevant result (rank 1 → 1.0, rank 3 → 0.33, missing → 0). It rewards *putting the right chunk first*, which is what the LLM actually sees most.",
              "For multi-chunk questions, count a hit if *any* expected source lands in the top k — stricter variants can wait."
            ]
          },
          {
            "type": "h4",
            "text": "Plumbing"
          },
          {
            "type": "ul",
            "items": [
              "Refactor `ask.py` so retrieval and answering are importable functions — `eval.py` should call them, not shell out.",
              "Log the run as one `json.dumps` line appended to `runs.jsonl`. Append-only files diff beautifully and never corrupt.",
              "Cache app answers per (question, config) if judge calls get slow — re-judging cached answers is free iteration."
            ]
          }
        ]
      },
      {
        "heading": "Before you write a line",
        "body": [
          {
            "type": "explain-back",
            "prompt": "Design check. Why must the retrieval metrics run **without** the LLM, and what exactly does handing the judge a **golden answer** buy you compared to asking it \"is this answer correct?\" cold?",
            "modelAnswer": "Layering is the point. Retrieval metrics (hit-rate@k, MRR) are **deterministic and free**: they compare retrieved chunk ids against expected ids — no LLM, no noise, instant to run on every change. That gives you a stable floor: if hit-rate drops, retrieval broke, full stop — no judge required to know it. Answer quality *does* need an LLM judge, but a naked \"is this correct?\" asks the judge to know the truth itself — now you're evaluating your app with another model's parametric knowledge, which is exactly the unreliability you're trying to measure. Handing the judge the **golden answer** converts the task from open-ended fact-checking into *text comparison* — \"does answer A state the same thing as reference B\" — which LLMs do far more reliably and consistently. The refusal questions complete the picture: they test the grounding rules specifically, and a fluent wrong answer there is the worst outcome, so it scores zero. With layered metrics, a regression localizes itself: hit-rate moved → retrieval/chunking; hit-rate flat but verdicts dropped → prompt/generation; refusals broke → grounding rules. Without layers, every regression is just \"the vibes got worse\".",
            "hint": "Think about what each layer isolates — and what the judge would have to *know* if you didn't give it the reference.",
            "commit": {
              "q": "After a chunk-size change, judge verdicts got worse but hit-rate@4 is identical. Where is the regression?",
              "opts": [
                "Retrieval — the store is returning the wrong chunks now",
                "Generation side — the right chunks come back, but their new boundaries hand the LLM worse text",
                "The judge — verdict noise, re-run until it looks better"
              ],
              "answer": 1,
              "why": "Identical hit-rate means the expected sources still arrive in the top k — retrieval is fine. What changed is the *content* of those chunks: new boundaries can chop ideas mid-thought, so the LLM answers from degraded context. That's exactly the fault-localization layered metrics exist to give you."
            }
          }
        ]
      }
    ]
  },
  "mleng-cap-design": {
    "sections": [
      {
        "heading": "The brief — design it on **paper**",
        "body": [
          {
            "type": "p",
            "text": "You're the first ML engineer at a company drowning in support tickets. No code this time — the deliverable is a **design**: boxes, arrows, numbers, and the reasoning behind every choice. Every decision must survive one question: *\"why not the alternative?\"*"
          },
          {
            "type": "ul",
            "items": [
              "**50,000 tickets/day** arrive by email and in-app chat.",
              "The knowledge lives in **2,000 help-center articles** — updated *weekly* by the support team.",
              "Goal: **draft replies for human agents** on every ticket, and **auto-answer the easy ~30%** (password resets, shipping status, how-tos).",
              "Auto-answers must **cite sources**. A wrong answer about **refund policy is an incident** — legal is watching.",
              "Draft must appear in the agent console within **10 seconds** of ticket open (p95).",
              "Inference budget ceiling: **$3,000/month**."
            ]
          },
          {
            "type": "table",
            "headers": [
              "Constraint",
              "Number",
              "Why it bites"
            ],
            "align": [
              "left",
              "center",
              "left"
            ],
            "rows": [
              [
                "Volume",
                "50K/day",
                "At this scale, tokens-per-ticket × price *is* the architecture"
              ],
              [
                "Freshness",
                "weekly",
                "Anything baked into model weights is stale within a week"
              ],
              [
                "Latency",
                "p95 < 10s",
                "Rules out huge contexts and long re-ranking chains on the hot path"
              ],
              [
                "Risk",
                "refunds",
                "One category has near-zero error tolerance — design for it explicitly"
              ],
              [
                "Budget",
                "$3K/mo",
                "A frontier model on every ticket blows this — do the arithmetic"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Deliverables",
        "body": [
          {
            "type": "ol",
            "items": [
              "**One-page architecture** — every box a component, every arrow labeled with *what flows* (text? vectors? events?). Ingestion path and serving path clearly separated.",
              "**Model plan** — which model(s), where, and the RAG vs fine-tune vs both call — with the losing option and *why it lost* written next to each choice.",
              "**Freshness plan** — articles change weekly: how the index keeps up, and how a stale answer gets *caught* rather than assumed away.",
              "**Eval + rollout plan** — where the golden set comes from, what the judge checks, the shadow → canary → full ramp, and the **one metric that halts the rollout**.",
              "**Cost envelope** — tokens/ticket × tickets/day × price, shown as arithmetic. If the naive plan is over budget (it is), show the levers that bring it under."
            ]
          },
          {
            "type": "p",
            "text": "Format: a real doc — markdown file, whiteboard photo, anything reviewable. If a staff engineer couldn't push back on it, it's not detailed enough."
          }
        ]
      },
      {
        "heading": "Trade-offs you must defend",
        "body": [
          {
            "type": "table",
            "headers": [
              "Decision",
              "Option A",
              "Option B",
              "What actually decides it"
            ],
            "align": [
              "left",
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Knowledge",
                "RAG over articles",
                "Fine-tune on past replies",
                "Weekly-changing policy vs. baked-in weights; what fine-tuning *actually* buys (style, format) vs. what it can't (freshness)"
              ],
              [
                "Model hosting",
                "Hosted API",
                "Self-host an 8B",
                "At 50K/day the math can flip — do the arithmetic including the ops headcount you don't have"
              ],
              [
                "Auto-answer gate",
                "Confidence-gated",
                "Humans draft everything",
                "Value of 30% deflection vs. cost of one wrong refund answer — and what signal the gate keys on"
              ],
              [
                "Retrieval",
                "Vector-only",
                "Hybrid BM25 + vector",
                "Error codes and product names are exact-match strings — pure embeddings whiff on them"
              ],
              [
                "Rollout",
                "Ship to all agents",
                "Shadow → canary",
                "Drafts always look fine in demos; only agent edit-distance on real tickets tells the truth"
              ]
            ]
          },
          {
            "type": "ul",
            "items": [
              "**Rules of the game:** auto-answers *cite or refuse* — no citation, no send.",
              "Refund and legal categories route to a human **unconditionally** — the gate is category-based before it is confidence-based.",
              "Every draft and every agent edit gets logged — that log is your future golden set *and* your fine-tuning corpus.",
              "State your assumptions with numbers (avg tokens per ticket, articles per query). Wrong-but-explicit beats vague."
            ]
          }
        ]
      },
      {
        "heading": "Defend your architecture",
        "body": [
          {
            "type": "explain-back",
            "prompt": "Present the full design as if to a skeptical staff engineer: architecture, model choices, freshness, the auto-answer gate, eval + rollout, and the cost arithmetic. Then defend the two trade-offs you found hardest — including the one the budget forces on you.",
            "modelAnswer": "**Architecture.** Two paths. *Ingestion*: CMS webhook fires on article publish → chunk (heading-aware) → embed → upsert into the vector store with article id + version; a weekly full re-index backstops missed webhooks. *Serving*: ticket opens → classifier tags category (refunds/legal → human unconditionally) → hybrid retrieval (BM25 + vector, merged, then a light re-rank) → grounded LLM call drafts a reply with citations → confidence gate decides draft-for-agent vs auto-send. **Knowledge: RAG, not fine-tuning.** Policy changes weekly; weights bake in stale refund rules — the exact incident we can't have. Fine-tuning earns a place *later*, trained on agent-edited drafts, for tone and format only — facts stay in the retrieval layer, always. **The gate** is layered: category blocklist first (refunds/legal never auto-send), then retrieval score must clear a floor, then the draft must contain citations that actually resolve to retrieved chunks — cite-or-refuse. **Cost is where the design gets honest.** Naive plan: frontier-class model, ~3K input tokens (context + article chunks) + ~500 output per ticket × 50K/day ≈ 150M input tokens/day — at ~$3/MTok that's ~$450/day ≈ **$13.5K/month: 4x over budget before output tokens**. Three levers bring it under: (1) **cascade** — a small cheap model drafts everything; only tickets it flags hard (~20-30%) escalate to the big model — the dominant volume now rides at ~5x cheaper; (2) **prompt caching** — the static system prompt + few-shot examples are identical across 50K calls/day, so the cached prefix reprices at ~0.1x; (3) **lazy drafting** — generate the draft when an agent *opens* the ticket, not for the ~15-20% of tickets that get merged, deduped, or closed untouched. Together that lands roughly in the $2-3K envelope with headroom to measure. **Eval + rollout.** Golden set mined from *resolved* tickets (real question, agent's final reply as golden answer), judge grades draft vs golden, refusal set for out-of-scope. Rollout: shadow (drafts generated, invisible, diffed against what agents actually sent) → canary with 5% of agents → ramp. Watched metrics: agent edit-distance, deflection rate, false-accept rate on auto-answers. **The halting metric: any wrong auto-answer in the refund category stops the rollout** — it's the stated incident condition, so it's the tripwire. **Hardest trade-offs:** hosted vs self-host — 8B self-hosted looks cheaper per token but adds an on-call surface and a serving stack we have zero headcount for, so hosted wins *until* volume 5-10x's; and the cascade — it adds a routing failure mode (hard ticket judged easy), which is why the gate checks citations and retrieval score on *every* auto-send, not just the escalated ones.",
            "hint": "Do the token arithmetic first — 50K/day × your tokens-per-ticket estimate × price. When it comes out over budget, the design question becomes: which levers cut cost without touching the refund-category guarantee?",
            "commit": {
              "q": "Your cost math says drafting every ticket with a frontier model runs ~4x over the $3K/month budget. Which lever do you pull FIRST?",
              "opts": [
                "Drop RAG and fine-tune a small model once — no retrieval context means far fewer input tokens",
                "Cascade — a small model drafts everything, the frontier model only takes tickets flagged hard — plus cache the static prompt prefix",
                "Cut max_tokens on the output until the monthly number fits"
              ],
              "answer": 1,
              "why": "The bill is dominated by input tokens × model price × volume. A cascade moves ~70-80% of volume to a ~5x cheaper model while keeping frontier quality for the hard tail, and caching reprices the repeated prefix at ~0.1x. Fine-tuning bakes weekly-changing policy into weights (the incident scenario), and output tokens were never the dominant term."
            }
          },
          {
            "type": "p",
            "text": "Done? Compare your design against the model answer above — not for a match, but for *coverage*: did you have an answer for every constraint it had to dodge? Where your design differs and you can say why, that's not a mistake — that's the job."
          }
        ]
      }
    ]
  },
};
