("${dockerimagename}")
        }

        stage('Pushing Image') {
            def registryCredential = 'dockerhub-credentials'
            docker.withRegistry('https://docker.com', registryCredential) {
                dockerImage.push("latest")
            }
        }

        stage('Deploying React.js container to Kubernetes') {
            kubernetesDeploy(configs: "deployment.yaml, service.yaml")
        }
    }
}
