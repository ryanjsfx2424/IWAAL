fname_old = "Lie_wallets_1.txt"
with open(fname_old, "r") as fid:
  lines = fid.readlines()

fname_new = "WL.json"
with open("WL.json", "w") as fid:
  fid.write("[\n")
  for line in lines:
    line = line.replace(" ","").replace("\t","").replace("\n","")
    if line[:2] != "0x":
      print("bad wallet? ", line)
      input(">>")
    elif len(line) != len("0x65AAf6d3fAe0E3BC43bB7cd48f4bb1B105Ab2b7E"):
      print("bad wallet? ", line)
      print("len was X but wanted Y: ", len(line), len("0x65AAf6d3fAe0E3BC43bB7cd48f4bb1B105Ab2b7E"))
    # end if/elif
    fid.write(' "' + line + '",\n')
  fid.write("]")
