---
title: Hartree-Fock Theory
date: 09-05-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/

---

# Hartree-Fock Theory: An Introduction

Every high schooler that has taken a course in physics has come across the Schrodinger Equation:

$$ \hat{H} \Psi = E \Psi $$

Here, $$ \hat{H} $$ is what is referred to as a "Hamiltonian", a mathematical operator (like $\frac{d}{dx}$) being applied to a function $\Psi$. The $\Psi$ is called the "wavefunction". This wavefunction usually describes a **particle** like the electron or proton, but it could also describe larger objects such as yourself!

Remember that Quantum Mechanics is a theory that was built up to agree with experiments and not the other way around. Nobody sat in a room and thought of quantum mechanics like Newton figured out classical mechanics. The experimental results came first, then a theory was devised to explain the experimental results. This does not mean quantum mechanics is "bullshit", the theory is excellent and is able to explain so much; just do not expect it to be intuitive.

So, we don't know what $\Psi$ is supposed to be. But we do have an interpretation of $|\Psi|^2$: it represents the probability density function of the said particle. If $\Psi(x)$ is a function of position, then $|\Psi(x)|^2$ tells us how "likely" it is for the particle to exist at the point $x$. Proof? We don't have one. It's an interpretation that just seems to work. It's a fundamental *postulate* of quantum mechanics. It is called the **Born Interpretation**.

Because of the peculiarities that arise at very small scales (these are too wide to be discussed in this post), the notions of "position", "momentum", "velocity" etc. become delocalized and therefore these quantities cannot be expressed as definite numbers in the case of Newtonian mechanics but instead probability distributions.

## The Schrodinger Equation for a Multi-Electron system

Consider a system of nuclei and electrons, this is what we call a "multi-electron" system. For this system the Hamiltonian is written as:

$$ \hat{H} = \sum_{i=0}^{n}{\left(- \frac{\hbar}{2 m_{e}} \nabla_{e,i}^2 - \sum_{A=0}^{N}{\frac{Z_{A}e^2}{4 \pi \epsilon_{0} |r_{i} - R_{A}|}}\right)} + \sum_{A < B}^{N}{\frac{Z_{A}Z_{B}e^2}{4 \pi \epsilon_{0} |R_{A} - R_{B}|}} + \sum_{i < j}{\frac{e^2}{4 \pi \epsilon_{0} |r_{i} - r_{j}|}} + \sum_{A=0}^{N}{- \frac{\hbar^2}{2 m_{A}} \nabla_{A}^2} $$

That is a mouthful of an expression. But it's just high school physics.

Remember that the Hamiltonian operator acts on a function to yield the energy times that said function (that is the point of $\hat{H} \Psi = E \Psi$). In more technical terms, we say that the function $\Psi$ is an *eigenfunction* of the Hamiltonian operator and the energy $E$ is the *eigenvalue*, drawing parallels to linear algebra. Most of quantum mechanics in practice is finding out these eigenfunctions and eigenvalues.

So each term in the Hamiltonian actually corresponds to the energy. Let's review them.

| Term | Interpretation |
| --- | --- |
| $$ - \frac{\hbar}{2 m_{e}} \nabla_{e,i}^2 $$ | Electronic kinetic energy |
| $$ - \sum_{A=0}^{N}{\frac{Z_{A}e^2}{4 \pi \epsilon_{0} |r_{i} - R_{A}|}} $$ | Electron-nuclear attractive energy |
| $$ + \sum_{A < B}^{N}{\frac{Z_{A}Z_{B}e^2}{4 \pi \epsilon_{0} |R_{A} - R_{B}|}} $$ | Nuclear-nuclear repulsion energy |
| $$ + \sum_{i < j}{\frac{e^2}{4 \pi \epsilon_{0} |r_{i} - r_{j}|}} $$ | Electron-electron repulsion energy |
| $$ - \frac{\hbar^2}{2 m_{A}} \nabla_{A}^2 $$ |  Nuclear kinetic energy |

## The Quantum Many-Body Problem

For a single proton and an electron (i.e., the Hydrogen atom) we can actually [solve the Schrodinger equation analytically](https://hyperphysics.phy-astr.gsu.edu/hbase/quantum/hydsch.html). However, if there is more than one electron we have this term:

$$ \sum_{i < j}{\frac{e^2}{4 \pi \epsilon_{0} |r_{i} - r_{j}|}} $$

This electron-electron interaction term makes it difficult to solve for the electron wavefunction. 

So..just solve it numerically then, what's the big deal?

Let's see: Consider a wavefunction $\Psi_{e}$. An wavefunction of electrons. Provided we work in the position basis, $\Psi_{e}$ is a function of $\mathbf{x}_{1}, \mathbf{x}_{2}, \ldots \mathbf{x}_{n}$. Here, $\mathbf{x}_{k}$ is a vector representing the 3D position of an electron.

Let's say we have 30 electrons. The electronic wavefunction will have a dimension of $30 \times 3 = 90$. A 90 dimensional wavefunction. Suppose we are solving it numerically on a grid of 100 points in each dimension (100 points is nothing by the way, most fluid dynamics finite element solvers require thousands of grid points!). The dimension required would be:

$$ 100 \times 100 \times \ldots \text{90 times} \ldots \times 100 = 100^{90} $$

If each grid point is storing the value of the wavefunction as a 32-bit float (4 bytes), we would need $ 4 \times 100^{90} $ bytes of data just to store the wavefunction. That is $\approx 10^{171}$ GB of data! Is it because our computers are weak? Well, consider a bit to be stored in the Hydrogen atom (the simplest classical/quantum memory bit possible). A hydrogen atom has a mass of $1.67 \times 10^{-27}$ kg. To store $3.2 \times 10^{172}$ **bits** we would need a memory unit made entirely of Hydrogen atoms weighing $10^{145}$ kg. The mass of the Earth, by the way, is $10^{24}$ kg. Up till now, even with all this science fiction, **it is impossible**.

And this is just for 30 electrons with a coarse grid of 100 points!

We cannot solve the SE analytically or numerically. But do we need to? If we could just approximate a solution...*drumroll*

Enter Hartree-Fock Theory.

## ACT I: The Born-Oppenheimer Approximation

## ACT II: Single Slater Ansatz

## ACT III: The Anti-Symmetrizer

## ACT IV: The Variational Principle

## ACT V: Slater-Condon Rules

## ACT VI: Energy Minimization

## ACT VII: Hartree-Fock Integro-Differential Equation

## ACT VIII: Canonical Form

## ACT IX: Roothaan-Hall Equation & The Self-Consistent Field

