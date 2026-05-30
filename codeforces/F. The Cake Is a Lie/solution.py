import sys
import math


def extended_gcd(a, b):
	if b == 0:
		return a, 1, 0
	g, x1, y1 = extended_gcd(b, a % b)
	return g, y1, x1 - (a // b) * y1


def mod_inverse(a, m):
	g, x, _ = extended_gcd(a, m)
	if g != 1:
		return None
	return x % m


class AP:
	__slots__ = ("first", "step", "count")

	def __init__(self, first=0, step=1, count=0):
		self.first = first
		self.step = step
		self.count = count

	def empty(self):
		return self.count <= 0


def intersect_with_valid(ap, residue, mod, upper_bound):
	if ap.empty():
		return AP()

	f = ap.first
	d = ap.step
	c = ap.count
	t_low = 0
	t_high = c - 1

	if f > upper_bound or f + d * t_high < 0:
		return AP()

	if f < 0:
		t_low = max(t_low, (-f + d - 1) // d)
	if f + d * t_high > upper_bound:
		t_high = min(t_high, (upper_bound - f) // d)
	if t_low > t_high:
		return AP()

	rhs = (residue - f) % mod
	g = math.gcd(d, mod)
	if rhs % g != 0:
		return AP()

	d_reduced = d // g
	mod_reduced = mod // g
	rhs_reduced = rhs // g
	inv = mod_inverse(d_reduced % mod_reduced, mod_reduced)
	t0 = (rhs_reduced * inv) % mod_reduced

	if t0 < t_low:
		t0 += ((t_low - t0 + mod_reduced - 1) // mod_reduced) * mod_reduced
	if t0 > t_high:
		return AP()

	count = (t_high - t0) // mod_reduced + 1
	first = f + d * t0
	step = d * mod_reduced
	return AP(first, step, count)


def map_transition(ap, a, b, k):
	if ap.empty():
		return AP()

	f = ap.first
	d = ap.step
	c = ap.count

	y0 = (k - b * f) // a
	step = (b * d) // a
	first = y0 - step * (c - 1)
	return AP(first, step, c)


def max_consecutive_perfect(a, b, k):
	g = math.gcd(a, b)
	if k % g != 0:
		return 0, False

	a //= g
	b //= g
	k //= g

	# If recurrence has a fixed point, we can keep serving perfect pancakes forever.
	if k % (a + b) == 0:
		return 10**30, True

	if a == b:
		if k % a != 0:
			return 0, False
		return 10**30, True

	inv_b = mod_inverse(b % a, a)
	residue = (k % a) * inv_b % a
	upper_bound = k // b

	start = residue
	if start > upper_bound:
		return 0, False
	valid = AP(start, a, (upper_bound - start) // a + 1)

	current = valid
	length = 0
	while True:
		usable = intersect_with_valid(current, residue, a, upper_bound)
		if usable.empty():
			break
		length += 1
		current = map_transition(usable, a, b, k)

	return length, False


def run_length_from_state(x, a, b, k, limit):
	seen = set()
	count = 0
	current = x

	while count < limit:
		if current in seen:
			return 10**30, True
		seen.add(current)

		remaining = k - b * current
		if remaining < 0 or remaining % a != 0:
			break

		count += 1
		current = remaining // a

	return count, False


def best_with_arbitrary_start(m, best_run, infinite_run):
	if m <= 0:
		return 0
	if infinite_run:
		return m
	if best_run == 0:
		return 0
	block = best_run + 1
	full = m // block
	rem = m % block
	return full * best_run + min(rem, best_run)


def solve_case(n, a, b, k):
	best_run, infinite_run = max_consecutive_perfect(a, b, k)
	m = n - 1
	perfectCookCake = best_with_arbitrary_start(m, best_run, infinite_run)

	if k % a == 0:
		d1 = k // a
		run_from_d1, run_infinite = run_length_from_state(d1, a, b, k, m)
		if run_infinite:
			perfectCookCake = max(perfectCookCake, 1 + m)
		else:
			limit = min(run_from_d1, m)
			candidate = 1 + best_with_arbitrary_start(m - 1, best_run, infinite_run)
			for used in range(1, limit + 1):
				if used == m:
					candidate = max(candidate, 1 + used)
				else:
					tail = best_with_arbitrary_start(m - used - 1, best_run, infinite_run)
					candidate = max(candidate, 1 + used + tail)
			perfectCookCake = max(perfectCookCake, candidate)

	return perfectCookCake


def solve():
	data = sys.stdin.read().split()
	if not data:
		return

	t = int(data[0])
	index = 1
	answers = []

	for _ in range(t):
		n = int(data[index])
		a = int(data[index + 1])
		b = int(data[index + 2])
		k = int(data[index + 3])
		index += 4
		answers.append(str(solve_case(n, a, b, k)))

	sys.stdout.write("\n".join(answers))


if __name__ == "__main__":
	solve()
