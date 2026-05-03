---
title: Gaussian Process Regression
date: 14-04-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/
---

# Recap: Bayes Rule

*This is a necessary concept before we start with what a GPR is*.

Suppose:

- There is a medical test for a rare disease that if tested positive, has an accuracy of 95%. Meaning, the test was given to 100 people who had the disease, and it showed "positive" for 95 people. The test was then given 100 people who did not have the disease and it showed "negative" for 95 people.

- The disease itself occurs at the rate of 1% in the general population.

If a person from the general population tests positive, what is the probability that he has the disease?

We get a little bit mathy and use the following expressions:

| Expression | Description |
| ---        | ---         |
| $ P(+) $ | Probability that someone tests positive. |
| $P(+ | D)$ | Probability that test gives positive given someone has the disease. |
| $P(D)$     | Probability of the disease occurring in the general population. |
| $ P(D | +) $ | Probability that someone has the disease given they have tested positive. |

We are trying to find:

$$P(D | +)$$

The way I find intuitive to solve this problem is by construction of a probability "flow chart" something I'd picked up from my JEE professor:

![Bayes Chart](ml/gpr/bayes_chart.png)

This chart should be self-explanatory if you've been reading. Now, we have to remember: the test result has already come back positive that means: we disregard all the branches where the tests are negative.

![Bayes Chart Relevant](ml/gpr/bayes_chart_relevant_branch.png)

Now from this chart, we have to find out the probability that the right branch occurs.

Intuitively, it should just be the probability of the right branch, divided by the total probability of the two branches. That is,

$$ \frac{0.01 \cdot 0.95}{0.01 \cdot 0.95 + 0.99 \cdot 0.05} = 0.161$$

There we have the answer: the probability someone has a disease if they tested positive on this test is 16.1%. The test is poor! What this tells us is, if the disease is rare, the test has to be extremely accurate. 

But anyways, let's think about what we just did here. 

The denominator i.e., $0.01 \cdot 0.95 + 0.99 \cdot 0.05$ is just the probability of testing positive on the test regardless of whether you have the disease or not.

The numerator $0.01 \cdot 0.95$ is a product of two quantities: one, the probability of having the disease $P(D)$ and the probability of testing positive if you have the disease: $P(+|D)$.

And the expression gives us: the probability of having the disease if you test positive $P(D|+)$.

Combining all the above, we can write the same expression in notation form:

$$ P(D|+) = \frac{P(+|D)P(D)}{P(+)} $$

This is **Bayes Rule**.

In Bayesian language, we call $P(D)$ the "prior". This is our knowledge before we did the test, that it occurs 1% in the general population, so our patient must have a 1% chance of having the disease.

$P(D|+)$ is called the "posterior". Now that we did the test, and got positive, the probability of him having the disease jumps from 1% to 16.1%. Still not enough for a diagnosis which is why multiple tests of different underlying methods are done to confirm a disease.
