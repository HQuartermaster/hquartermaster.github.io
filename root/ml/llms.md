---
title: On Large Language Models
date: 14-06-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/
citations:
    gpt4training:
        author: "Stephen M. Walker II"
        year: 2023
        link: "https://medium.com/@smwii/gpt-4-how-openai-built-an-ai-model-10x-larger-than-gpt-3-3f5eacaad69a"
        title: "GPT-4: How OpenAI Built an AI Model 10x Larger Than GPT-3"
    sarvamtraining:
        author: "NVIDIA Corporation"
        year: 2026
        link: "https://www.nvidia.com/en-us/case-studies/sarvam-sovereign-ai/"
        title: "Sarvam Sovereign AI"
    shannon1948:
        author: "C.E. Shannon"
        year: 1948
        link: https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf
---

# LLMs are not that costly

On 13th June 2026, 07:26 IST I woke up to discover that Anthropic Inc., an American multinational corporation, was instructed by the US government to withdraw its latest large language model, the **Fable 5** for all **non-US entities and individuals**.

The Fable 5 is a publicly accessible variant (behind a somewhat affordable paywall of ₹1,999 / month) of its state of the art Claude Mythos that it was hyped up to be so good it could be used to find vulnerabilities in established software and help experienced programmers conduct cybersecurity breaches. 

Immediately, the non-American internet was in shock. The restriction on non-US citizens meant that even Andrej Karpathy (one of the leading figures in AI and an employee of Anthropic as of June 2026) or Rahul Patil (Anthropic's CTO) could not technically use Fable-class models as they are not American citizens. Although, I'm sure there's enough ways to loophole around that and most of it is just media noise, but the optics of it certainly look terrible for non-US citizens.

Immediately, there was a big response from people all over X. And we have a bunch of people, many even big names making false claims about the true cost of large language models.

## You don't need billions of dollars to make a frontier LLM.

You don't. Take GPT 4 for instance. It was trained on just 25,000 A100 class GPUs[@gpt4training]. That costs about $200-400M in today's money. It's not a small amount, but not particularly big either. And this cost will come down eventually once Chinese GPUs begin to hit the market. 

India's own LLM (or I'd called it MLM for now, Medium Language Model), i.e., Sarvam-30B and Sarvam-105B [@sarvamtraining] were trained on just 4,096 NVIDIA H100 GPUs. All these GPUs are within India as of speaking. If you've tried out Sarvam via their Indus app, it is a fairly capable model and now even features the ability to post images and react accordingly to them. 

The Chinese models such as Deepseek R1, Kimi K2.5, and Qwen are all fairly capable. Kimi K2.5 in fact seems to be able to do 90% (don't quote me on that, just anecdotal experience) of whatever Claude Opus 4.8 can do. I have not tried out Fable so I cannot tell but Chinese models should reach Fable capability eventually. None of these companies have billions in evaluation.

## So what is the fuss about? 

American corporations do not just want to make LLMs, they want to serve LLMs to the rest of the world. 

There are two phases of compute usage of making an LLM, in oversimplified terms.

- **Training**: Once the neural network architecture along with shenanigans like transformers, multi-headed attention is written in code, the model is trained via a backpropagation algorithm and an optimizer. This process is very computationally intensive but it has to be done just once per release. You can use 4,000 H-100s, 10,000 H-100s, or 50,000 H-100s to do it. The only difference would be the time taken. A 4,000 cluster training GPT5 would take a year, a 50,000 GB-200 cluster to train GPT5 would take a few days. Maybe, again, don't quote me on that, but training a state-of-the-art model doesn't necessarily require the largest cluster in existence. With fewer GPUs, you can often achieve the same total training compute, but the training run takes much longer.

- **Inference**: Once you have a trained model, you save the weights and serve it via a web server to your customers. Now, whenever a prompt request comes in, you run a forward pass (much less computationally intensive than backprop). A forward pass for a prompt for GPT4 can be done on just one H-100 if the model is quantized to 4-bit. Even something like GPT5 with 1.5 trillion parameters is possible on just a few GPUs because modern LLMs are ultimately MoEs (mixture of experts), not all parameters need to be loaded into memory at once. But here's the real problem: **you have to serve millions of customers at once**. You need tons of webservers facing your customers, tons of GPUs to process these simultaneous requests. That's where the cost lies. 

The real infrastructure cost is distribution; not building the actual model.

And to be fair, the true heroes who made LLMs possible are not OpenAI, or Anthropic, or Meta, or any one of these forward facing companies, it is ultimately the likes of NVIDIA, SK Hynix, and TSMC. Shannon pretty much gave away encoder-decoder architecture (theoretically) in his seminal paper on Information Theory in 1948 itself[@shannon1948]. We've had neural networks and perceptrons since 1970s, it was these modern compute devices, once made to do high performance matrix multiplications to render GTA 5 and Cyberpunk 2077, that made LLMs feasible. 

## About Talent

Much of the math that is required for LLMs is present in the high school curriculum of the Indian schools system. Linear Algebra, Statistics, Probability, Geometry. Some aspects such as information theory, proving convergence properties, scaling laws would need some tutoring, but it is not something like high energy physics or general relavity that requires a long pedigree of graduate and post-graduate science education to master. Much of LLM research is practical, researchers essentially try things (you can call them educated guesses) until something sticks to a wall, as we do not have a theory of learning. This does not mean that talent is cheap because the number of people who can put that math into highly optimized code to extract as much performance out of a chip as possible is still small enough and highly sought after. 

## Strategic Implications

LLMs (and related AI models) are "information integrators". They have the ability to take information from a dozen, a hundred, maybe at some point even a million sources, and extract out the relevant parts.

Think of a battlefield where there are a dozen sources of information: ground radars, aircraft radars, cameras on tanks, soldiers, infantry and armoured regiment positions, enemy aircraft positions, and so on, for human planners, such amount of information can be hard to handle. For an AI model? Not so much. The AI can integrate all that information to detect the most important threat vectors and give human planners a "bird's eye" summary allowing them to take decisions in a much more efficient manner. 

Or in cybersecurity, where an AI model can brute force its way into a system by trying out various possibilities and lines of attack until something breaks. 

The strategic implications are massive. In an environment where Pakistan has China's backing, we could see a future where the Pakistani military has access to state-of-the-art LLM models while India is left alone; with the US restricting access to non-US customers.

## What to do? 

Just do it. It's not that hard. We don't have to serve millions of customers like American AI corporations that guzzles billions in compute. Having frontier-class models to serve our researchers, military and industry would be good enough for now. 