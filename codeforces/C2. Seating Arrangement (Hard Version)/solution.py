import sys


def solve():
	data = sys.stdin.read().split()
	if not data:
		return

	t = int(data[0])
	index = 1
	answers = []

	for _ in range(t):
		n = int(data[index])
		x = int(data[index + 1])
		s = int(data[index + 2])
		index += 3
		personalities = data[index]
		index += 1

		openers = 0
		seated = 0
		promotable = 0
		eia = s

		for person in personalities:
			if person == 'I':
				if openers < x:
					openers += 1
					seated += 1
			elif person == 'A':
				seated += 1
				promotable += 1
				while seated > openers * eia and openers < x and promotable > 0:
					promotable -= 1
					openers += 1
				if seated > openers * eia:
					seated -= 1
					promotable -= 1
			else:
				seated += 1
				while seated > openers * eia and openers < x and promotable > 0:
					promotable -= 1
					openers += 1
				if seated > openers * eia:
					seated -= 1

		answers.append(str(seated))

	sys.stdout.write("\n".join(answers))


if __name__ == "__main__":
	solve()
