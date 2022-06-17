import meshio

mesh = meshio.read(
    "data/cube.msh",  # string, os.PathLike, or a buffer/open file
    # file_format="stl",  # optional if filename is a path; inferred from extension
    # see meshio-convert -h for all possible formats
)
# mesh.points, mesh.cells, mesh.cells_dict, ...

print(mesh.points)
print(mesh.cells)

print(mesh.cells_dict)

def fct():
    return [[1,2,3],[2,3,0], [0, 1, 2], [3,1,0]]

def decomposeTetra(tetraCell):
    cells = []
    for a in fct():
        cell = []
        for i in a:
            cell.push(tetraCell[i])
        cells.push(cell)
    return cells    

def decompose(mesh):
    
mesh.write("cube.obj")

