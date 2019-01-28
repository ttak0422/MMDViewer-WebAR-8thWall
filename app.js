const modelScale = 0.1;
const modelFile = 'assets/model/MMD/Alicia_solid.pmx';
const vmdFiles = ['assets/vmd/vmd1.vmd'];

const MMDViewerPipeLineModule = () => {
    const raycaster = new THREE.Raycaster();
    const tapPosition = new THREE.Vector2();
    const loader = new THREE.MMDLoader();
    const helper = new THREE.MMDAnimationHelper({afterglow: 2.0});
    const clock = new THREE.Clock();

    let surface = null;
    let mesh = null;
    let hasLoaded = false;

    const initXRScene = ({ scene, camera }) => {
        console.log('initXrScene');
        surface = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide
            })
        );
        surface.rotateX(-Math.PI / 2)
        surface.position.set(0, 0, 0)
        scene.add(surface);
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));

        loader.loadWithAnimation(modelFile, vmdFiles,
            // Success
            (mmd) => {
                hasLoaded = true;
                mesh = mmd.mesh;
                mesh.position.set(100, 0, 100);
                mesh.scale.set(modelScale, modelScale, modelScale);
                XR.Threejs.xrScene().scene.add(mesh);
                helper.add(mesh, {
                    animation: mmd.animation,
                    physics: false
                });
            },
            // Progress
            (xhr) => {
                if(xhr.lengthComputable) {
                    const percentComplete = xhr.loaded/xhr.total*100;
                    console.log(`${Math.round(percentComplete, 2)}% downloaded...`);
                }
            },
            // Error
            (xhr) => {
                console.log('Failed loading a mmd model or vmd motions.');
            }
        );
    }

    const moveObject = (pointX, pointZ) => {
        if(hasLoaded){
            console.log(`Place at ${pointX} ${pointZ}`);
            mesh.position.x = pointX;
            mesh.position.z = pointZ;
        }
    }

    const touchHandler = (e) => {
        console.log('on touch start');

        if(e.touches.length == 2){
            XR.XrController.recenter();
        } else if(e.touches.length > 2){
            return;
        }

        const {scene, camera} = XR.Threejs.xrScene()

        tapPosition.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1
        tapPosition.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1

        raycaster.setFromCamera(tapPosition, camera)

        const intersects = raycaster.intersectObject(surface)

        if (intersects.length == 1 && intersects[0].object == surface) {
            moveObject(intersects[0].point.x, intersects[0].point.z)
        }

    }

    const animate = () => {
        helper.update(clock.getDelta());
        requestAnimationFrame(animate);
    }

    return {
        name: 'mmdviewer',

        onStart: ({canvas, canvasWidth, canvasHeight}) => {
            const {scene, camera} = XR.Threejs.xrScene();
            initXRScene({scene, camera});

            canvas.addEventListener('touchstart', touchHandler, true);

            animate();

            XR.XrController.updateCameraProjectionMatrix({
                origin: camera.position,
                facing: camera.quaternion
            });
        },


    }

}

const onxrloaded = () => {
    console.log('onxrloaded');

    XR.addCameraPipelineModules([
        XR.GlTextureRenderer.pipelineModule(),
        XR.Threejs.pipelineModule(),
        XR.XrController.pipelineModule(),
        XRExtras.AlmostThere.pipelineModule(),
        XRExtras.FullWindowCanvas.pipelineModule(),
        XRExtras.Loading.pipelineModule(),
        XRExtras.RuntimeError.pipelineModule(),
        MMDViewerPipeLineModule(),
    ]);

    XR.run({
        canvas: document.getElementById('camerafeed')
    });
}

const load = () => {
    console.log('load');
    XRExtras.Loading.showLoading({onxrloaded});
}

window.onload = () => {
    console.log('onload');
    window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load);
}