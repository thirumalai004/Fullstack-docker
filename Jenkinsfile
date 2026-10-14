pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    booleanParam(name: 'PUSH_IMAGES', defaultValue: false,
                 description: 'Also push the built images to Docker Hub')
  }

  environment {
    // Separate project name so this never touches your dev containers/volumes
    COMPOSE_PROJECT_NAME = 'fullstack-prod'
    COMPOSE_FILE         = 'docker-compose.prod.yml'

    POSTGRES_USER = 'appuser'
    POSTGRES_DB   = 'appdb'
    PROD_PORT     = '3500'

    DOCKERHUB_USER = 'thirudocker004'      // change to your Docker Hub username
    IMAGE_TAG      = "${env.BUILD_NUMBER}"

    // Jenkins credential (Secret text) holding the database password
    POSTGRES_PASSWORD = credentials('fullstack-db-password')
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Check Docker') {
      steps {
        sh '''
          docker version --format 'Docker server: {{.Server.Version}}'
          docker compose version
        '''
      }
    }

    stage('Validate Compose File') {
      steps {
        sh 'docker compose config -q'
      }
    }

    stage('Build Images') {
      steps {
        sh 'docker compose build --pull'
      }
    }

    stage('Push to Docker Hub') {
      when { expression { params.PUSH_IMAGES } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                          usernameVariable: 'DH_USER',
                                          passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            docker compose push
            for svc in backend frontend; do
              docker tag "$DOCKERHUB_USER/fullstack-$svc:$IMAGE_TAG" "$DOCKERHUB_USER/fullstack-$svc:latest"
              docker push "$DOCKERHUB_USER/fullstack-$svc:latest"
            done
            docker logout
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sh 'docker compose up -d --remove-orphans'
      }
    }

    stage('Smoke Test') {
      steps {
        // Goes through nginx -> backend -> database, from inside the Docker network
        sh '''
          for i in $(seq 1 15); do
            if docker compose exec -T frontend wget -qO- http://localhost/api/health | grep -q '"status":"ok"'; then
              echo "Health check passed"
              exit 0
            fi
            echo "Waiting for the app... ($i/15)"
            sleep 4
          done
          echo "Health check failed"
          docker compose ps
          docker compose logs --tail 50
          exit 1
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed build #${env.BUILD_NUMBER}: http://localhost:${env.PROD_PORT}"
    }
    failure {
      echo 'Build or deploy failed. Check the stage logs above.'
    }
    always {
      sh 'docker image prune -f || true'
    }
  }
}
