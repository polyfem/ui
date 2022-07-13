import meshio
import os
import sys

url = sys.argv[1]
targetURL = sys.argv[2]

mesh = meshio.read(
    url,  # string, os.PathLike, or a buffer/open file
    # file_format="stl",  # optional if filename is a path; inferred from extension
    # see meshio-convert -h for all possible formats
)
# mesh.points, mesh.cells, mesh.cells_dict, ...

print(mesh.points)
print(mesh.cells)

print(mesh.cells_dict)

def fct():
    return [[1,2,3],[2,3,0], [0, 1, 2], [1, 3,0],
            [2, 1, 3], [3, 2, 0], [1, 0, 2], [3, 1, 0]]

def decomposeTetra(tetraCell):
    cells = []
    for a in fct():
        cell = []
        for i in a:
            cell.append(tetraCell[i])
        cells.append(cell)
    return cells    

def decompose(mesh):
    cells = []
    tetraCells = mesh.cells_dict.get('tetra')
    if(tetraCells is not None):
        for tetraCell in tetraCells:
            cells += decomposeTetra(tetraCell)        
    triangleCells = mesh.cells_dict.get('triangle')
    if(triangleCells is not None):
        cells+=triangleCells.tolist()
    newMesh =  meshio.Mesh(
                mesh.points,
                [('triangle', cells)]
            )
    return newMesh

newMesh = decompose(mesh)
print(newMesh.cells_dict)
newMesh.write(targetURL)

