---
title: Fast Fourier Transform
date: 29-04-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/
citations:
    fabrice:
        author: "Fabrice Bellard"
        year: 2026
        title: "Fabrice Bellard's Homepage"
        link: https://bellard.org/
    ctwiki:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Cooley-Tukey Algorithm"
        link: https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm
    pcm:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Pulse-Code Modulation"
        link: https://en.wikipedia.org/wiki/Pulse-code_modulation
    waveform:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Waveform"
        link: https://en.wikipedia.org/wiki/Waveform
    dac:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Digital-to-Analog Converter"
        link: https://en.wikipedia.org/wiki/Digital-to-analog_converter
    diracdelta:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Dirac-Delta"
        link: https://en.wikipedia.org/wiki/Dirac_delta_function
    heisenberg1925:
        author: "Werner Heisenberg"
        year: 1925
        title: "Quantum Theoretical Reinterpretation of Kinematic and Mechanical Relations"
        link: "https://wucj.lab.westlake.edu.cn/Others/Heisenberg_Quantum_Mechanics.pdf"
    shannon1949:
        author: "Claude E. Shannon"
        year: 1949
        title: "Communication in the Presence of Noise"
        link: "https://ieeexplore.ieee.org/document/1697831/"
---

# The Fast Fourier Transform

For most of my teenagehood, the FFT was a strange mystery; the tool of wizards like Fabrice Bellard[@fabrice] and the experts over in the field of quantum chemistry using it to speed up their calculations. I knew the rough sketch of what it was, and what it did, but one glance at the Wikipedia page for the Cooley-Tukey Algorithm[@ctwiki], and I'd be falling asleep. This article is written to make the FFT and its practical implementation accessible to people who otherwise do not have the time to sit through the relevant papers and also as a reference for my future self! 

## The Fourier Transform

Suppose we have a function $f(t)$, the Fourier transform of this function is given by the following formula:

$$ \hat{f}(\omega) = \int_{-\infty}^{\infty}{e^{-2 \pi i \omega t} h(t) dt} $$

Here, we are taking a function of $t$, and turning it into a function of another quantity $f$ via the improper integral. $f(t)$ is called the "time-space representation" of the function, and $\hat{f}(\omega)$ is called the "frequency-space representation"; they are said to represent the same function but as functions of different variables.

## What does the Fourier transform do?

A Fourier transform tells us what "frequencies" a function is composed of. "Frequency" of what? Sine and cosine waves.

Any real-valued function can be represented as an infinite sum of sines and cosines: 

$$ f(t) = a_{0} + \sum_{n=1}^{\infty}{a_{n} \sin{nx} + b_{n} \cos{nx}} $$

The Fourier Transform turns this real valued function into a complex valued function $\hat{f}({\omega})$. 

The value of $\hat{f}({\omega})$ tells us: 

- **magnitude** i.e., $|\hat{f}({\omega})|$: The amplitude of frequency $\omega$ to the whole signal.
- **angle** i.e., $\arctan{\frac{Im(\hat{f}({\omega}))}{Re(\hat{f}({\omega}))}}$: The phase shift to be applied to the frequency $\omega$

Take the case of the sine wave with a frequency of 440 Hz:

$$ \sin{2\pi(440)t} $$

We plot the wave form and the Fourier transform:

![](sci/ft440hz.png)

You can see how the Fourier transform peaks at 440 Hz, this is what it is telling us: out of all the frequencies, the one at 440 Hz is the most prominent in this signal.

You might wonder why it doesn't just peak at 440 and have the rest of the frequencies be 0, after all, in our wave we ONLY have 440 Hz. The answer is: yes, it should. The actual Fourier transform would be a Dirac-Delta[@diracdelta] at 440. But this graph is generated using Numpy's FFT library and there we supply a "window" of data (the sine function does not stretch out to infinity on a computer) and we have a sampling frequency, leading to other frequencies also showing up as it is not a truly analytical periodic sine wave. 

This is what we call the time-frequency uncertainty principle. A signal cannot be localized in time and frequency simultaneously. If you have a "windowed" signal, you cannot have its true frequency representation. Apply this to quantum wavefunctions, and you get the famous Heisenberg uncertainty principle[@heisenberg1925]! In quantum mechanics, the momentum wavefunction is a Fourier transform of the position wavefunction, i.e.,

$$ \Psi({p}) = \frac{1}{\sqrt{2\pi\hbar}} \int_{-\infty}^{\infty}{\Psi(x)e^{-\frac{ipx}{\hbar}} dx} $$

How wonderful! But we're going ahead of ourselves.

If you want a more in depth explanation of the Fourier transform, this YouTube video by 3blue1brown is **the** best explanation I've encountered so far. In fact, I suggest you pause reading this article and go through this 17-minute video.

<iframe width="560" height="315" src="https://www.youtube.com/embed/spUNpyF58BY?si=7R4T-PNgSbkgbyuo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Audio as a Source of Data

In practice, $f$ is usually a signal, often periodic (but it does not have to be). Take the most common example: audio data. 

In a computer, the audio data looks like a string of numbers:

```
0
1254
2481
3653
4746
5736
6602
7325
4554
1248
146
-958
-2047
-3100
-4097
-5018
-5847
-2612
-1552
-462
```

This is what we call PCM (pulse-code modulation)[@pcm]. A sequence of 16-bit signed numbers. Each data point here represents the amplitude. Physically, the amplitude is the displacement of the diaphragm of your speaker. The DAC[@dac] converts each PCM input to an analog signal, which then (via an amplifier and other related circuitry) drives the diaphragm of the speaker to produce sound. The most common frequency used by speakers is 44,100 Hz. So each amplitude here is a value for $\frac{1}{44100}$ of a second. 

It really _is_ that simple. Sound is just a sequence of numbers. Sound is not an instant phenomenon. The richness of sound does not come from a single instant. Its richness comes from its structure through time. You may have noticed a "graph" your microphone recorder app makes when you record sound. Something like this:

![](sci/spectrogram.png)

This is what is called a wave form[@waveform]. It is just a plot of the PCM values against time. The reason why it looks so "crowded" is of course, we are sampling usually at the rate of 22,100 or 44,100 samples per second, so there are a *lot* of points per second.

Our hardware uses PCM data in time space as it is easy to map the movement of the diaphgram to. Yet the our ears and brains work in frequency space. You can "tell" from your ears the difference between a 440 Hz wave and a 100 Hz wave form. Suppose an annoying high pitch sound is part of your PCM data. How do you remove it? You take the Fourier transform of the PCM data, remove the high frequency values, and then do an inverse Fourier transform to get the new PCM data. This is what all audio filters fundamentally do!

## The Discrete Fourier Transform

This expression,

$$ \hat{f}(\omega) = \int_{-\infty}^{\infty}{e^{-2 \pi i \omega t} h(t) dt} $$

...works when $f(t)$ is an analytical function. However, in real life, $f(t)$ is usually a signal, that is being sampled at a finite rate. In reality, we don't really have $f(t)$ as a function. Instead we have $f(t_0), f(t_1), f(t_2) ... f(t_{n})$, i.e., the values of $f$ at discrete points in time. 

For this, we have the discrete variant of the Fourier transform aptly named the Discrete Fourier Transform.

### Derivation of the DFT

Suppose we are sampling the signal $f(t)$ at discrete intervals $T_{s}$, this "discretized" function can actually be represented as $f_{s}(t)$ using the Dirac-delta as follows:

$$ f_{s}(t) = f(t)\sum_{i=0}^{N}{\delta(t - i T_s)} $$

This is quite simple to understand. The Dirac-Delta returns 1 when 0 and 0 otherwise. When $t$ is a multiple of $T_{s}$, the summation only returns 1 (and thus the value of $f(t)$) if we are at a point where the signal is being sampled, otherwise all the $\delta(t - i T_s)$ in the sum are 0 and the function is 0.

Now, we apply Fourier transform to $f_{s}(t)$:

$$ \int_{-\infty}^{\infty}{e^{-i 2\pi \omega t}f(t)\sum_{i=0}^{N}{\delta(t - n T_s)}} dt $$

Taking the summation out,

$$ \sum_{n=0}^{N}{\int_{-\infty}^{\infty}{e^{-i 2\pi \omega t}f(t)\delta(t - n T_s)dt}} $$

The Dirac-Delta has an interesting property, called the **sifting property**:

$$ \int_{-\infty}^{\infty}{f(t)\delta(t - t_{0})} = f(t_{0}) $$

We use the above property to get:

$$ \sum_{n=0}^{N}{e^{-i 2\pi \omega n T_s}f(n T_s)} $$

Now, I am going to make a change of notation to what books typically use. Since we are not working with functions, it is kind of pointless to use $f(n T_s)$. In reality, our "function" is an array of numbers (discrete samples). It is much more apt to define,

$$ x_{n} = f(n T_s) $$

> ### Discretization of Frequency
> Another thing is that since our time domain is discretized our frequency domain is also discretized. There's a very important thing to remember: if your sampling frequency is $F$ Hz, you cannot measure frequencies more than $\frac{F}{2}$ Hz! This is the famous Nyquist-Shannon Sampling theorem[@shannon1949]. 
>
> Why is this the case? 
>
> Think of a fan rotating at 30 RPM. To measure the fan speed, you will need at least two snapshots. If a camera takes photos at the rate of 30 photos per minute, you get one shot per minute. Let's say the first shot was taken when the fan was at the the "0" position. The second shot will be taken when the fan turns one revolution (and therefore back at 0). In the camera's reel, the fan would look completely still!
>
> What if the camera were to take photos at 45 photos per minute? 
> - The camera takes the first shot when the fan is at 0.
> - The second shot is taken when the fan does 2/3 of a revolution , i.e., at angle 240.
> - The third shot is taken when the fan rotates 4/3, i.e., at angle 480 (which is 120).
>
> (and so on)
> | Shot (N) | Revolution                                     | Degrees                     | Time (s) |
> |----------|---                                             |---                          |----------|
> | 1        | 0/3                                            | 0°                          | 0.00     |
> | 2        | 2/3                                            | 240°                        | 1.33     |
> | 3        | 4/3                                            | 120°                        | 2.67     |
> | 4        | 6/3                                            | 0°                          | 4.00     |
>
> A revolution took 4 seconds for the camera, while 30 RPMs means 2 seconds per revolution. It would thus appear to the camera that the fan is rotating **backwards** at the rate of 15 RPM!
>
> A camera would thus need to take 60 shots per minute to measure a 30 RPM fan. The first shot will be taken at 0, the second at when the fan is half way, and the third shot back at 0, allowing us to capture the full rotation of the fan.
> 
> This is the same reason why audio samples are sampled at 44 kHz because the human ear can hear up to 20 kHz, and to sample that range correctly, we need a frequency of at least 40 kHz. The reason we need 44.1 kHz that the additional 4.1 kHz provides a small buffer for anti-aliasing filters to remove frequencies above 40 kHz. (This is not relevant to our discussion)

Since we are in the discrete frequency space, we switch from $\omega$ to a discrete variable, $omega_{k}$.

$$ \omega_{k} = \frac{k}{N T_{s}} \quad \text{for } k = {0, 1, 2, ..., N-1} $$

This is a little harder to explain, and I'll get an intuitive explanation for this in the future. But for now, just keep in mind that our frequency spectrum is discrete and we sample at values $\frac{1}{N T_s}, \frac{2}{N T_s}, ..., \frac{N - 1}{N T_s}$.

Substituting this in the DFT expression, we get:

$$ \sum_{i=0}^{N}{e^{-i 2\pi (\frac{k}{N T_s}) n T_s}x_{n}} $$

$$ X_{k} = \sum_{i=0}^{N}{e^{-i 2\pi k}x_{n}} $$

And that is the expression for the Discrete Fourier Transform.

As you can see, we have values for $0$ to $N - 1$ frequencies to calculate, and each calculation requires a sum of length $N$. Even if we ignored the upper half (as the frequencies repeat, as we discussed before), we will have a complexity of $\frac{N}{2} N$, the algorithm is still $O(N^2)$ in nature.

$O(N^2)$ may not seem like a big deal, but that changes once you see the scale of real-world data. Take audio for example: a 5 minute song sampled at 44,100 Hz contains $ 5 \times 60 \times 44100 = 13,\!230,\!000 $ samples.

A naive $O(N^2)$ Discrete Fourier Transform on this data would require on the order of $ N^2 \approx 1.75\times 10^{14} $ operations. 

That is computationally massive. Even on modern hardware, performing a full naive DFT on such a dataset would be slow as hell. This computational burden is precisely why the **Fast Fourier Transform (FFT)** is so important: by exploiting symmetry and redundancy in the DFT, it reduces the complexity from $ O(N^2)\rightarrow O(N\log N) $ making Fourier analysis feasible for large real-world datasets.

